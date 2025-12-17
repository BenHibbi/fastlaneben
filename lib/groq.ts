import Groq from 'groq-sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { validateAndFix, looksLikeReactCode, type ValidationError } from './react-validator'

// Custom error class for sanitization failures
export class SanitizationError extends Error {
  public readonly code: string
  public readonly details: string[]
  public readonly attempts: number

  constructor(message: string, details: string[], attempts: number) {
    super(message)
    this.name = 'SanitizationError'
    this.code = 'SANITIZATION_FAILED'
    this.details = details
    this.attempts = attempts
  }
}

// Initialize Groq client
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set')
  }
  return new Groq({ apiKey })
}

// Load prompt from markdown file
function loadPrompt(filename: string): string {
  const promptPath = join(process.cwd(), 'prompts', filename)
  return readFileSync(promptPath, 'utf-8')
}

// Lazy-load prompts (cached after first load)
let briefPromptCache: string | null = null
let sanitizePromptCache: string | null = null
let sanitizeStrictPromptCache: string | null = null

function getBriefPrompt(): string {
  if (!briefPromptCache) {
    briefPromptCache = loadPrompt('creative-brief-analysis.md')
  }
  return briefPromptCache
}

function getSanitizePrompt(): string {
  if (!sanitizePromptCache) {
    sanitizePromptCache = loadPrompt('react-code-sanitizer.md')
  }
  return sanitizePromptCache
}

function getSanitizeStrictPrompt(): string {
  if (!sanitizeStrictPromptCache) {
    sanitizeStrictPromptCache = loadPrompt('react-code-sanitizer-strict.md')
  }
  return sanitizeStrictPromptCache
}

// Transcribe audio using Whisper
export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string
): Promise<{ text: string; duration: number }> {
  const groq = getGroqClient()

  // Create a File-like object from the buffer - convert to Uint8Array for compatibility
  const file = new File([new Uint8Array(audioBuffer)], filename, { type: 'audio/webm' })

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3-turbo',
    temperature: 0,
    response_format: 'verbose_json'
  })

  return {
    text: transcription.text,
    duration: Math.round((transcription as { duration?: number }).duration || 0)
  }
}

// Analyze transcript and generate structured creative brief
export async function analyzeTranscript(
  transcript: string,
  context: {
    business_name: string | null
    industry: string | null
    location: string | null
  }
): Promise<Record<string, unknown>> {
  const groq = getGroqClient()

  const userMessage = `
Client Context:
- Business: ${context.business_name || 'Not specified'}
- Industry: ${context.industry || 'Not specified'}
- Location: ${context.location || 'Not specified'}

Voice Transcript:
${transcript}
`

  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: getBriefPrompt() },
      { role: 'user', content: userMessage }
    ],
    temperature: 1,
    max_tokens: 8192
  })

  const content = response.choices[0]?.message?.content || '{}'

  try {
    return JSON.parse(content)
  } catch {
    // If parsing fails, return raw content wrapped
    return { raw_response: content, parse_error: true }
  }
}

// Sanitization result type
export interface SanitizationResult {
  code: string
  attempts: number
  fixesApplied: string[]
  warnings: string[]
}

// Sanitize React code for safe preview rendering
// Strategy: Try auto-fix first (fast), only use LLM if auto-fix fails
export async function sanitizeReactCode(rawCode: string): Promise<SanitizationResult> {
  const allFixesApplied: string[] = []
  const allWarnings: string[] = []

  // Validate raw code looks like React
  if (!looksLikeReactCode(rawCode)) {
    throw new SanitizationError(
      'Input does not appear to be valid React code',
      ['Missing component function or JSX'],
      0
    )
  }

  // STEP 1: Try auto-fix directly on raw code (no LLM needed)
  console.log('[Sanitization] Step 1: Attempting direct auto-fix')
  const directFix = validateAndFix(rawCode)

  if (directFix.fixesApplied.length > 0) {
    allFixesApplied.push(...directFix.fixesApplied.map(f => `[Direct] ${f}`))
    console.log('[Sanitization] Direct auto-fix applied:', directFix.fixesApplied)
  }

  if (directFix.warnings.length > 0) {
    allWarnings.push(...directFix.warnings)
  }

  if (directFix.valid) {
    console.log('[Sanitization] SUCCESS via direct auto-fix')
    return {
      code: directFix.code,
      attempts: 0, // 0 means no LLM was needed
      fixesApplied: allFixesApplied,
      warnings: allWarnings
    }
  }

  // STEP 2: If direct fix failed, try LLM
  console.log('[Sanitization] Step 2: Direct fix insufficient, trying LLM')
  const groq = getGroqClient()
  const MAX_LLM_ATTEMPTS = 2
  let lastCode = directFix.code // Start with partially fixed code
  let lastErrors: ValidationError[] = directFix.errors

  for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt++) {
    console.log(`[Sanitization] LLM Attempt ${attempt}/${MAX_LLM_ATTEMPTS}`)

    // Use strict prompt always since we already tried basic auto-fix
    const prompt = getSanitizeStrictPrompt()

    // Build user message with context
    const errorSummary = lastErrors.map(e => `- ${e.message}`).join('\n')
    const userMessage = `The following React code still has issues after auto-fix:\n${errorSummary}\n\nPlease sanitize this code to work in a browser preview (no imports, no exports, component named Preview):\n\n${lastCode}`

    try {
      const response = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b', // Most capable model on Groq
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        max_tokens: 32768 // Large output for long components
      })

      const llmOutput = response.choices[0]?.message?.content

      if (!llmOutput || llmOutput.trim().length === 0) {
        console.log(`[Sanitization] LLM Attempt ${attempt}: Empty response`)
        lastErrors = [{ type: 'syntax', message: 'LLM returned empty response', fixable: false }]
        continue
      }

      // Validate and auto-fix the LLM output
      const validation = validateAndFix(llmOutput)

      if (validation.fixesApplied.length > 0) {
        allFixesApplied.push(...validation.fixesApplied.map(f => `[LLM ${attempt}] ${f}`))
        console.log(`[Sanitization] LLM Attempt ${attempt}: Applied fixes:`, validation.fixesApplied)
      }

      if (validation.warnings.length > 0) {
        allWarnings.push(...validation.warnings)
      }

      if (validation.valid) {
        console.log(`[Sanitization] SUCCESS via LLM attempt ${attempt}`)
        return {
          code: validation.code,
          attempts: attempt,
          fixesApplied: allFixesApplied,
          warnings: allWarnings
        }
      }

      // Not valid yet - prepare for retry
      lastCode = validation.code
      lastErrors = validation.errors
      console.log(`[Sanitization] LLM Attempt ${attempt}: Validation failed with ${lastErrors.length} errors`)

    } catch (err) {
      console.error(`[Sanitization] LLM Attempt ${attempt}: Error:`, err)
      lastErrors = [{ type: 'syntax', message: `LLM error: ${err instanceof Error ? err.message : 'Unknown'}`, fixable: false }]
    }
  }

  // STEP 3: If LLM also failed, return the best we have if it's "good enough"
  // "Good enough" = only has non-critical errors (like TypeScript that esbuild can handle)
  const criticalErrors = lastErrors.filter(e =>
    e.type === 'syntax' || e.type === 'dangerous'
  )

  if (criticalErrors.length === 0 && lastCode.length > 100) {
    console.log('[Sanitization] Returning partially sanitized code (non-critical errors only)')
    return {
      code: lastCode,
      attempts: MAX_LLM_ATTEMPTS,
      fixesApplied: allFixesApplied,
      warnings: [...allWarnings, 'Code has minor issues but should work']
    }
  }

  // All attempts failed - throw detailed error
  const errorDetails = lastErrors.map(e => e.message)
  throw new SanitizationError(
    `Code sanitization failed after auto-fix and ${MAX_LLM_ATTEMPTS} LLM attempts`,
    errorDetails,
    MAX_LLM_ATTEMPTS
  )
}

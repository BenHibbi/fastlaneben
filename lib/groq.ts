import Groq from 'groq-sdk'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { validateMinimal, looksLikeReactCode } from './react-validator'

// Custom error class for sanitization failures
export class SanitizationError extends Error {
  public readonly code: string
  public readonly details: string[]
  public readonly attempts: number
  public readonly debugInfo: string

  constructor(message: string, details: string[], attempts: number, debugInfo: string = '') {
    super(message)
    this.name = 'SanitizationError'
    this.code = 'SANITIZATION_FAILED'
    this.details = details
    this.attempts = attempts
    this.debugInfo = debugInfo
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
    model: 'llama-3.3-70b-versatile',
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
// Strategy: Trust the LLM - send raw code directly, validate minimally
export async function sanitizeReactCode(rawCode: string): Promise<SanitizationResult> {
  const warnings: string[] = []

  // Basic check that input looks like React
  if (!looksLikeReactCode(rawCode)) {
    throw new SanitizationError(
      'Input does not appear to be valid React code',
      ['Missing component function or JSX'],
      0
    )
  }

  const groq = getGroqClient()
  const MAX_ATTEMPTS = 2

  console.log('[Sanitization] Sending code to LLM for transformation')

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[Sanitization] Attempt ${attempt}/${MAX_ATTEMPTS}`)

    try {
      // Build the user message - on retry, include error feedback
      const lineCount = rawCode.split('\n').length
      let userMessage = `[Code: ${lineCount} lignes - output attendu de taille similaire]\n\n${rawCode}`
      if (attempt > 1 && warnings.length > 0) {
        userMessage = `ERREURS DE LA TENTATIVE PRÉCÉDENTE:\n${warnings.join('\n')}\n\nCorrige ces erreurs dans le code suivant (${lineCount} lignes):\n\n${rawCode}`
      }

      const response = await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b', // 65536 output tokens max, faster and cheaper
        messages: [
          { role: 'system', content: getSanitizeStrictPrompt() },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.1,
        max_completion_tokens: 32768 // gpt-oss-120b supports up to 65536 output tokens
      })

      const llmOutput = response.choices[0]?.message?.content
      const finishReason = response.choices[0]?.finish_reason

      // Store debug info for error reporting
      const debugParts: string[] = []
      debugParts.push(`finish_reason=${finishReason}`)
      debugParts.push(`output_length=${llmOutput?.length || 0}`)

      console.log(`[Sanitization] Attempt ${attempt}: ${debugParts.join(', ')}`)

      if (!llmOutput || llmOutput.trim().length === 0) {
        console.log(`[Sanitization] Attempt ${attempt}: Empty response from LLM`)
        warnings.push('LLM returned empty response')
        continue
      }

      // Check if output was truncated
      if (finishReason === 'length') {
        console.log(`[Sanitization] Attempt ${attempt}: Output truncated by token limit!`)
        warnings.push('LLM output was truncated (token limit reached)')
        continue
      }

      // Store last 300 chars for debug
      const lastChars = llmOutput.slice(-300)
      debugParts.push(`last_chars=${lastChars}`)
      console.log(`[Sanitization] Last 300 chars: ${lastChars}`)


      // Minimal validation - only check critical errors
      const validation = validateMinimal(llmOutput)

      if (validation.valid) {
        console.log(`[Sanitization] SUCCESS on attempt ${attempt}`)
        return {
          code: validation.code, // Use cleaned code (markdown stripped)
          attempts: attempt,
          fixesApplied: ['LLM transformation'],
          warnings: []
        }
      }

      // Validation failed - store errors for retry
      console.log(`[Sanitization] Attempt ${attempt} validation failed:`, validation.errors)
      warnings.length = 0 // Clear previous
      warnings.push(...validation.errors)

    } catch (err) {
      console.error(`[Sanitization] Attempt ${attempt} error:`, err)
      warnings.push(`LLM error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // All attempts failed
  throw new SanitizationError(
    `Code sanitization failed after ${MAX_ATTEMPTS} attempts`,
    warnings,
    MAX_ATTEMPTS
  )
}

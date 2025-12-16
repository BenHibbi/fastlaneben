import Groq from 'groq-sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

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

// Sanitize React code for safe preview rendering
export async function sanitizeReactCode(rawCode: string): Promise<string> {
  const groq = getGroqClient()

  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: getSanitizePrompt() },
      { role: 'user', content: rawCode }
    ],
    temperature: 0.3,
    max_tokens: 8192
  })

  return response.choices[0]?.message?.content || rawCode
}

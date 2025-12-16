import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@/lib/supabase/server'

// Cache the system prompt
let systemPromptCache: string | null = null

function getSystemPrompt(): string {
  if (!systemPromptCache) {
    const promptPath = join(process.cwd(), 'prompts', 'support-agent.md')
    systemPromptCache = readFileSync(promptPath, 'utf-8')
  }
  return systemPromptCache
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set')
  }
  return new Groq({ apiKey })
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { clientId, messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Verify client belongs to user and is in LIVE state
    if (clientId) {
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, state, user_id')
        .eq('id', clientId)
        .single()

      const client = clientData as { id: string; state: string; user_id: string | null } | null

      if (!client || client.user_id !== user.id) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }

      if (client.state !== 'LIVE') {
        return NextResponse.json(
          { error: 'Support is only available for live sites' },
          { status: 403 }
        )
      }
    }

    const groq = getGroqClient()
    const systemPrompt = getSystemPrompt()

    const response = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      ],
      temperature: 0.5,
      max_tokens: 1024
    })

    const assistantMessage = response.choices[0]?.message?.content || ''

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('Support chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}

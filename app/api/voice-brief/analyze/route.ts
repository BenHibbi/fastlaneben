import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeTranscript } from '@/lib/groq'
import { voiceBriefAnalyzeSchema, validateRequest } from '@/lib/validation'
import { voiceBriefLogger } from '@/lib/logger'
import type { Client, VoiceBrief } from '@/types/database'

export const runtime = 'nodejs'

// POST - Analyze transcript and generate creative brief
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateRequest(voiceBriefAnalyzeSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { clientId, voiceBriefId } = validation.data
    const supabase = createAdminClient()

    // Get client and voice brief
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, business_name, industry, location')
      .eq('id', clientId)
      .single()

    if (clientError || !clientData) {
      voiceBriefLogger.warn('Client not found for analysis', { clientId })
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const client = clientData as Pick<Client, 'id' | 'business_name' | 'industry' | 'location'>

    const { data: voiceBriefData, error: briefError } = await supabase
      .from('voice_briefs')
      .select('id, transcript, audio_url')
      .eq('id', voiceBriefId)
      .eq('client_id', clientId)
      .single()

    if (briefError || !voiceBriefData) {
      return NextResponse.json(
        { error: 'Voice brief not found' },
        { status: 404 }
      )
    }

    const voiceBrief = voiceBriefData as Pick<VoiceBrief, 'id' | 'transcript' | 'audio_url'>

    if (!voiceBrief.transcript) {
      return NextResponse.json(
        { error: 'No transcript available to analyze' },
        { status: 400 }
      )
    }

    // Analyze with GPT-OSS-120B
    const structuredBrief = await analyzeTranscript(voiceBrief.transcript, {
      business_name: client.business_name,
      industry: client.industry,
      location: client.location
    })

    // Update voice brief with structured brief and clear transcript/audio to save storage
    const { error: updateError } = await supabase
      .from('voice_briefs')
      .update({
        structured_brief: structuredBrief,
        transcript: null,
        audio_url: null
      } as never)
      .eq('id', voiceBriefId)

    if (updateError) {
      voiceBriefLogger.error('Failed to save structured brief', {
        voiceBriefId,
        error: updateError.message
      })
      return NextResponse.json(
        { error: 'Failed to save structured brief' },
        { status: 500 }
      )
    }

    // Delete audio file from storage if it exists
    if (voiceBrief.audio_url) {
      try {
        const urlParts = voiceBrief.audio_url.split('/client-files/')
        if (urlParts[1]) {
          const filePath = urlParts[1].split('?')[0]
          await supabase.storage.from('client-files').remove([filePath])
        }
      } catch (deleteError) {
        voiceBriefLogger.warn('Failed to delete audio file', {
          voiceBriefId,
          error: deleteError instanceof Error ? deleteError.message : String(deleteError)
        })
      }
    }

    // Update client status
    await supabase
      .from('clients')
      .update({
        creative_brief_status: 'brief_generated',
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', clientId)

    voiceBriefLogger.info('Brief generated', { clientId, voiceBriefId })

    return NextResponse.json({
      success: true,
      structuredBrief
    })
  } catch (error) {
    voiceBriefLogger.error('Analyze error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Failed to analyze transcript' },
      { status: 500 }
    )
  }
}

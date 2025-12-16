import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { analyzeTranscript } from '@/lib/groq'

export const runtime = 'nodejs'

// POST - Analyze transcript and generate creative brief
export async function POST(request: NextRequest) {
  try {
    const { clientId, voiceBriefId } = await request.json()

    if (!clientId || !voiceBriefId) {
      return NextResponse.json(
        { error: 'Client ID and voice brief ID are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get client and voice brief
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, business_name, industry, location')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const clientData = client as { id: string; business_name: string | null; industry: string | null; location: string | null }

    const { data: voiceBrief, error: briefError } = await supabase
      .from('voice_briefs')
      .select('*')
      .eq('id', voiceBriefId)
      .eq('client_id', clientId)
      .single()

    if (briefError || !voiceBrief) {
      return NextResponse.json(
        { error: 'Voice brief not found' },
        { status: 404 }
      )
    }

    const briefData = voiceBrief as { id: string; transcript: string | null; audio_url: string | null }

    if (!briefData.transcript) {
      return NextResponse.json(
        { error: 'No transcript available to analyze' },
        { status: 400 }
      )
    }

    // Analyze with GPT-OSS-120B
    const structuredBrief = await analyzeTranscript(briefData.transcript, {
      business_name: clientData.business_name,
      industry: clientData.industry,
      location: clientData.location
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
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to save structured brief' },
        { status: 500 }
      )
    }

    // Delete audio file from storage if it exists
    if (briefData.audio_url) {
      try {
        // Extract path from URL (format: .../client-files/clientId/voice-brief-xxx.webm)
        const urlParts = briefData.audio_url.split('/client-files/')
        if (urlParts[1]) {
          const filePath = urlParts[1].split('?')[0] // Remove query params if any
          await supabase.storage.from('client-files').remove([filePath])
        }
      } catch (deleteError) {
        console.warn('Failed to delete audio file:', deleteError)
        // Non-blocking - continue even if delete fails
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

    return NextResponse.json({
      success: true,
      structuredBrief
    })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze transcript' },
      { status: 500 }
    )
  }
}

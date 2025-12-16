import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { transcribeAudio } from '@/lib/groq'
import { voiceBriefUploadSchema, validateRequest } from '@/lib/validation'
import { voiceBriefLogger } from '@/lib/logger'
import type { Client, VoiceBrief } from '@/types/database'

export const runtime = 'nodejs'

// POST - Upload and transcribe audio
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const clientId = formData.get('clientId') as string

    // Validate clientId
    const validation = validateRequest(voiceBriefUploadSchema, { clientId })
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify client exists and is in FINAL_ONBOARDING
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, state, business_name, industry, location')
      .eq('id', clientId)
      .single()

    if (clientError || !clientData) {
      voiceBriefLogger.warn('Client not found', { clientId })
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const client = clientData as Pick<Client, 'id' | 'state' | 'business_name' | 'industry' | 'location'>

    if (client.state !== 'FINAL_ONBOARDING') {
      return NextResponse.json(
        { error: 'Client is not in final onboarding state' },
        { status: 400 }
      )
    }

    // Upload audio to Supabase Storage
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
    const filename = `${clientId}/voice-brief-${Date.now()}.webm`

    const { error: uploadError } = await supabase.storage
      .from('client-files')
      .upload(filename, audioBuffer, {
        contentType: 'audio/webm',
        upsert: true
      })

    if (uploadError) {
      voiceBriefLogger.error('Upload failed', {
        clientId,
        error: uploadError.message
      })
      return NextResponse.json(
        { error: 'Failed to upload audio' },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl }
    } = supabase.storage.from('client-files').getPublicUrl(filename)

    // Transcribe with Groq Whisper
    const { text: transcript, duration } = await transcribeAudio(
      audioBuffer,
      audioFile.name || 'recording.webm'
    )

    // Save voice brief record
    const { data: voiceBriefData, error: insertError } = await supabase
      .from('voice_briefs')
      .insert({
        client_id: clientId,
        audio_url: publicUrl,
        transcript,
        duration_seconds: duration
      } as never)
      .select()
      .single()

    if (insertError) {
      voiceBriefLogger.error('Insert failed', {
        clientId,
        error: insertError.message
      })
      return NextResponse.json(
        { error: 'Failed to save voice brief' },
        { status: 500 }
      )
    }

    const voiceBrief = voiceBriefData as VoiceBrief

    // Update client status
    await supabase
      .from('clients')
      .update({
        creative_brief_status: 'voice_recorded',
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', clientId)

    voiceBriefLogger.info('Voice brief created', {
      clientId,
      voiceBriefId: voiceBrief.id,
      duration
    })

    return NextResponse.json({
      success: true,
      voiceBrief,
      transcript
    })
  } catch (error) {
    voiceBriefLogger.error('Voice brief error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Failed to process voice brief' },
      { status: 500 }
    )
  }
}

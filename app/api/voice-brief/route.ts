import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { transcribeAudio, analyzeTranscript } from '@/lib/groq'

export const runtime = 'nodejs'

// POST - Upload and transcribe audio
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const clientId = formData.get('clientId') as string

    if (!audioFile || !clientId) {
      return NextResponse.json(
        { error: 'Audio file and client ID are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify client exists and is in FINAL_ONBOARDING
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, state, business_name, industry, location')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const clientData = client as { id: string; state: string; business_name: string | null; industry: string | null; location: string | null }

    if (clientData.state !== 'FINAL_ONBOARDING') {
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
      console.error('Upload error:', uploadError)
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
    const { data: voiceBrief, error: insertError } = await supabase
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
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save voice brief' },
        { status: 500 }
      )
    }

    // Update client status
    await supabase
      .from('clients')
      .update({
        creative_brief_status: 'voice_recorded',
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', clientId)

    return NextResponse.json({
      success: true,
      voiceBrief,
      transcript
    })
  } catch (error) {
    console.error('Voice brief error:', error)
    return NextResponse.json(
      { error: 'Failed to process voice brief' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeReactCode } from '@/lib/groq'
import { sendFirstPreviewEmail, sendSecondPreviewEmail } from '@/lib/email'

export const runtime = 'nodejs'

// POST - Admin posts React code (sanitizes with LLM)
export async function POST(request: NextRequest) {
  try {
    const { clientId, rawCode, adminId } = await request.json()

    if (!clientId || !rawCode) {
      return NextResponse.json(
        { error: 'Client ID and code are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify client exists and is in FINAL_ONBOARDING
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, state')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const clientData = client as { id: string; state: string }

    if (clientData.state !== 'FINAL_ONBOARDING') {
      return NextResponse.json(
        { error: 'Client is not in final onboarding state' },
        { status: 400 }
      )
    }

    // Get current version number
    const { data: existingPreviews } = await supabase
      .from('react_previews')
      .select('version')
      .eq('client_id', clientId)
      .order('version', { ascending: false })
      .limit(1)

    const previews = existingPreviews as { version: number }[] | null
    const nextVersion = previews?.[0]?.version
      ? previews[0].version + 1
      : 1

    // Deactivate all previous previews
    await supabase
      .from('react_previews')
      .update({ is_active: false } as never)
      .eq('client_id', clientId)

    // Sanitize code with LLM
    const sanitizedCode = await sanitizeReactCode(rawCode)

    // Save new preview
    const { data: preview, error: insertError } = await supabase
      .from('react_previews')
      .insert({
        client_id: clientId,
        raw_code: rawCode,
        sanitized_code: sanitizedCode,
        version: nextVersion,
        is_active: true,
        created_by: adminId || null
      } as never)
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save preview' },
        { status: 500 }
      )
    }

    const previewData = preview as { id: string; version: number; sanitized_code: string }

    // Update client with preview reference and phase
    // For version 1: set revision_round to 1
    // For version 2+: increment revision_round (up to 2)
    const updateData: Record<string, unknown> = {
      current_react_preview_id: previewData.id,
      onboarding_phase: 'react_preview',
      revision_modifications_used: 0,
      updated_at: new Date().toISOString()
    }

    if (nextVersion === 1) {
      updateData.revision_round = 1
    } else if (nextVersion === 2) {
      updateData.revision_round = 2
    }

    await supabase
      .from('clients')
      .update(updateData as never)
      .eq('id', clientId)

    // Send email notification based on version
    const { data: clientInfo } = await supabase
      .from('clients')
      .select('email, business_name')
      .eq('id', clientId)
      .single()

    if (clientInfo) {
      const typedClient = clientInfo as { email: string; business_name: string | null }
      if (nextVersion === 1) {
        await sendFirstPreviewEmail(typedClient.email, typedClient.business_name || 'your business')
      } else if (nextVersion === 2) {
        await sendSecondPreviewEmail(typedClient.email, typedClient.business_name || 'your business')
      }
    }

    return NextResponse.json({
      success: true,
      preview: {
        id: previewData.id,
        version: previewData.version,
        sanitizedCode: previewData.sanitized_code
      }
    })
  } catch (error) {
    console.error('React preview error:', error)
    return NextResponse.json(
      { error: 'Failed to create preview' },
      { status: 500 }
    )
  }
}

// GET - Fetch active preview for client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: preview, error } = await supabase
      .from('react_previews')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (error || !preview) {
      return NextResponse.json({ preview: null })
    }

    const previewData = preview as { id: string; version: number; sanitized_code: string; created_at: string }

    console.log('GET preview - sanitized_code length:', previewData.sanitized_code?.length || 0)
    console.log('GET preview - first 200 chars:', previewData.sanitized_code?.substring(0, 200))

    return NextResponse.json({
      preview: {
        id: previewData.id,
        version: previewData.version,
        sanitizedCode: previewData.sanitized_code,
        createdAt: previewData.created_at
      }
    })
  } catch (error) {
    console.error('Get preview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 500 }
    )
  }
}

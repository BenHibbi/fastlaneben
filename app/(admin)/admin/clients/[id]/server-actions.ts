'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdmin } from '@/lib/auth/admin'
import { sendMockupReadyEmail, sendSiteLiveEmail } from '@/lib/email'
import type { ClientState } from '@/types/database'

export async function transitionClientState(
  clientId: string,
  fromState: ClientState,
  toState: ClientState
) {
  const user = await verifyAdmin()
  const adminSupabase = createAdminClient()

  const { error: updateError } = await adminSupabase
    .from('clients')
    .update({
      state: toState,
      state_changed_at: new Date().toISOString(),
      revision_requested: false,
      updated_at: new Date().toISOString()
    } as never)
    .eq('id', clientId)

  if (updateError) {
    throw new Error('Failed to update client state')
  }

  await adminSupabase.from('state_transitions').insert({
    client_id: clientId,
    from_state: fromState,
    to_state: toState,
    triggered_by: user.id,
    trigger_type: 'ADMIN',
    metadata: { action: 'manual_transition' }
  } as never)

  return { success: true }
}

export async function updateClientUrls(
  clientId: string,
  previewUrl: string | null,
  liveUrl: string | null,
  currentState: ClientState
) {
  const user = await verifyAdmin()
  const adminSupabase = createAdminClient()

  // Auto-transition to LIVE when live_url is set and client is in FINAL_ONBOARDING
  const shouldTransitionToLive = liveUrl && currentState === 'FINAL_ONBOARDING'

  const updateData: Record<string, unknown> = {
    preview_url: previewUrl || null,
    live_url: liveUrl || null,
    updated_at: new Date().toISOString()
  }

  if (shouldTransitionToLive) {
    updateData.state = 'LIVE'
    updateData.state_changed_at = new Date().toISOString()
  }

  const { error } = await adminSupabase
    .from('clients')
    .update(updateData as never)
    .eq('id', clientId)

  if (error) {
    throw new Error('Failed to update URLs')
  }

  // Log state transition if it happened
  if (shouldTransitionToLive) {
    await adminSupabase.from('state_transitions').insert({
      client_id: clientId,
      from_state: 'FINAL_ONBOARDING',
      to_state: 'LIVE',
      triggered_by: user.id,
      trigger_type: 'ADMIN',
      metadata: { action: 'live_url_set' }
    } as never)

    // Send site live email
    const { data: client } = await adminSupabase
      .from('clients')
      .select('email, business_name')
      .eq('id', clientId)
      .single()

    if (client && liveUrl) {
      const clientData = client as { email: string; business_name: string | null }
      await sendSiteLiveEmail(clientData.email, clientData.business_name || 'Your', liveUrl)
    }
  }

  return { success: true, transitioned: shouldTransitionToLive }
}

export async function saveClientNotes(
  clientId: string,
  internalNotes: string
) {
  await verifyAdmin()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('clients')
    .update({
      internal_notes: internalNotes,
      updated_at: new Date().toISOString()
    } as never)
    .eq('id', clientId)

  if (error) {
    throw new Error('Failed to save notes')
  }

  return { success: true }
}

export async function updatePreviewScreenshots(
  clientId: string,
  screenshots: string[],
  currentState: ClientState
) {
  const user = await verifyAdmin()
  const adminSupabase = createAdminClient()

  // If uploading first mockup and client is in LOCKED state, transition to PREVIEW_READY
  const shouldTransition = screenshots.length > 0 && currentState === 'LOCKED'

  const updateData: Record<string, unknown> = {
    preview_screenshots: screenshots,
    updated_at: new Date().toISOString()
  }

  if (shouldTransition) {
    updateData.state = 'PREVIEW_READY'
    updateData.state_changed_at = new Date().toISOString()
  }

  const { error } = await adminSupabase
    .from('clients')
    .update(updateData as never)
    .eq('id', clientId)

  if (error) {
    throw new Error('Failed to update screenshots')
  }

  // Log state transition if it happened
  if (shouldTransition) {
    await adminSupabase.from('state_transitions').insert({
      client_id: clientId,
      from_state: 'LOCKED',
      to_state: 'PREVIEW_READY',
      triggered_by: user.id,
      trigger_type: 'ADMIN',
      metadata: { action: 'mockup_uploaded' }
    } as never)

    // Send mockup ready email
    const { data: client } = await adminSupabase
      .from('clients')
      .select('email, business_name')
      .eq('id', clientId)
      .single()

    if (client) {
      const clientData = client as { email: string; business_name: string | null }
      await sendMockupReadyEmail(clientData.email, clientData.business_name || 'your business')
    }
  }

  return { success: true, transitioned: shouldTransition }
}

export async function uploadMockup(
  clientId: string,
  formData: FormData
): Promise<{ url: string }> {
  await verifyAdmin()
  const adminSupabase = createAdminClient()

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${clientId}/mockup-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  // Convert File to ArrayBuffer for server-side upload
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await adminSupabase.storage
    .from('client-files')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  // Use signed URL (1 year expiry) since bucket may be private
  const { data: signedUrlData, error: signedUrlError } = await adminSupabase.storage
    .from('client-files')
    .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

  if (signedUrlError || !signedUrlData) {
    // Fallback to public URL if signed URL fails
    const { data: urlData } = adminSupabase.storage
      .from('client-files')
      .getPublicUrl(fileName)
    return { url: urlData.publicUrl }
  }

  return { url: signedUrlData.signedUrl }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Types for Supabase query results
type ClientRecord = {
  id: string
  email: string
  state: string
  revisions_remaining?: number
}

// Helper to get current user with email
async function getCurrentUser(): Promise<{ id: string; email: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    throw new Error('Not authenticated')
  }
  return { id: user.id, email: user.email }
}

// Submit intake form (creates client or updates existing, transitions to LOCKED)
export async function submitIntake(formData: {
  business_name: string
  industry: string
  location: string
  intake_data: Record<string, unknown>
}) {
  const user = await getCurrentUser()
  const adminSupabase = createAdminClient()

  // Check if client exists
  const { data: existingClientData } = await adminSupabase
    .from('clients')
    .select('id, state')
    .eq('email', user.email)
    .single()

  const existingClient = existingClientData as { id: string; state: string } | null

  if (existingClient) {
    // Update existing client
    const { error: updateError } = await adminSupabase
      .from('clients')
      .update({
        business_name: formData.business_name,
        industry: formData.industry,
        location: formData.location,
        intake_data: formData.intake_data,
        state: 'LOCKED',
        state_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', existingClient.id)

    if (updateError) {
      throw new Error('Failed to submit intake')
    }

    // Log transition
    await adminSupabase.from('state_transitions').insert({
      client_id: existingClient.id,
      from_state: existingClient.state,
      to_state: 'LOCKED',
      triggered_by: user.id,
      trigger_type: 'CLIENT',
      metadata: { action: 'intake_submitted' }
    } as never)

    return { success: true, clientId: existingClient.id }
  } else {
    // Create new client
    const { data: newClientData, error: insertError } = await adminSupabase
      .from('clients')
      .insert({
        user_id: user.id,
        email: user.email,
        business_name: formData.business_name,
        industry: formData.industry,
        location: formData.location,
        intake_data: formData.intake_data,
        state: 'LOCKED'
      } as never)
      .select()
      .single()

    const newClient = newClientData as { id: string } | null

    if (insertError || !newClient) {
      throw new Error('Failed to create client')
    }

    // Log transition
    await adminSupabase.from('state_transitions').insert({
      client_id: newClient.id,
      from_state: null,
      to_state: 'LOCKED',
      triggered_by: user.id,
      trigger_type: 'CLIENT',
      metadata: { action: 'intake_submitted' }
    } as never)

    return { success: true, clientId: newClient.id }
  }
}

// Approve preview - transitions from PREVIEW_READY to ACTIVATION
export async function approvePreview(clientId: string) {
  const user = await getCurrentUser()
  const adminSupabase = createAdminClient()

  // Verify ownership and state
  const { data: clientData } = await adminSupabase
    .from('clients')
    .select('id, state, email')
    .eq('id', clientId)
    .single()

  const client = clientData as ClientRecord | null

  if (!client || client.email !== user.email) {
    throw new Error('Unauthorized')
  }

  if (client.state !== 'PREVIEW_READY') {
    throw new Error('Invalid state for preview approval')
  }

  // Update state and record terms acceptance
  const { error: updateError } = await adminSupabase
    .from('clients')
    .update({
      state: 'ACTIVATION',
      state_changed_at: new Date().toISOString(),
      terms_accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as never)
    .eq('id', clientId)

  if (updateError) {
    throw new Error('Failed to approve preview')
  }

  // Log transition
  await adminSupabase.from('state_transitions').insert({
    client_id: clientId,
    from_state: 'PREVIEW_READY',
    to_state: 'ACTIVATION',
    triggered_by: user.id,
    trigger_type: 'CLIENT',
    metadata: { action: 'preview_approved' }
  } as never)

  return { success: true }
}

// Request revision - transitions from PREVIEW_READY back to LOCKED
export async function requestRevision(clientId: string, revisionNotes: string) {
  const user = await getCurrentUser()
  const adminSupabase = createAdminClient()

  // Verify ownership and state
  const { data: clientData } = await adminSupabase
    .from('clients')
    .select('id, state, email, revisions_remaining')
    .eq('id', clientId)
    .single()

  const client = clientData as ClientRecord | null

  if (!client || client.email !== user.email) {
    throw new Error('Unauthorized')
  }

  if (client.state !== 'PREVIEW_READY') {
    throw new Error('Invalid state for revision request')
  }

  const revisionsRemaining = client.revisions_remaining ?? 2
  if (revisionsRemaining <= 0) {
    throw new Error('No revisions remaining')
  }

  // Update state
  const { error: updateError } = await adminSupabase
    .from('clients')
    .update({
      state: 'LOCKED',
      state_changed_at: new Date().toISOString(),
      revision_requested: true,
      revision_notes: revisionNotes,
      revisions_remaining: revisionsRemaining - 1,
      updated_at: new Date().toISOString()
    } as never)
    .eq('id', clientId)

  if (updateError) {
    throw new Error('Failed to request revision')
  }

  // Log transition
  await adminSupabase.from('state_transitions').insert({
    client_id: clientId,
    from_state: 'PREVIEW_READY',
    to_state: 'LOCKED',
    triggered_by: user.id,
    trigger_type: 'CLIENT',
    metadata: { action: 'revision_requested', notes: revisionNotes }
  } as never)

  return { success: true }
}

// Save final onboarding content
export async function saveFinalContent(
  clientId: string,
  finalContent: Record<string, string>,
  finalImages: string[]
) {
  const user = await getCurrentUser()
  const adminSupabase = createAdminClient()

  // Verify ownership
  const { data: clientData } = await adminSupabase
    .from('clients')
    .select('id, state, email')
    .eq('id', clientId)
    .single()

  const client = clientData as ClientRecord | null

  if (!client || client.email !== user.email) {
    throw new Error('Unauthorized')
  }

  if (client.state !== 'FINAL_ONBOARDING') {
    throw new Error('Invalid state for final content submission')
  }

  // Update content
  const { error: updateError } = await adminSupabase
    .from('clients')
    .update({
      final_content: finalContent,
      final_images: finalImages,
      updated_at: new Date().toISOString()
    } as never)
    .eq('id', clientId)

  if (updateError) {
    throw new Error('Failed to save content')
  }

  // Log activity (not a state change, just content update)
  await adminSupabase.from('state_transitions').insert({
    client_id: clientId,
    from_state: 'FINAL_ONBOARDING',
    to_state: 'FINAL_ONBOARDING',
    triggered_by: user.id,
    trigger_type: 'CLIENT',
    metadata: { action: 'final_content_submitted' }
  } as never)

  return { success: true }
}

// Upload file to storage
export async function uploadClientFile(
  clientId: string,
  formData: FormData
): Promise<{ url: string }> {
  const user = await getCurrentUser()
  const adminSupabase = createAdminClient()

  // Verify ownership
  const { data: clientData } = await adminSupabase
    .from('clients')
    .select('id, email')
    .eq('id', clientId)
    .single()

  const client = clientData as { id: string; email: string } | null

  if (!client || client.email !== user.email) {
    throw new Error('Unauthorized')
  }

  const file = formData.get('file') as File
  if (!file) {
    throw new Error('No file provided')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${clientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

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

  const { data: urlData } = adminSupabase.storage
    .from('client-files')
    .getPublicUrl(fileName)

  return { url: urlData.publicUrl }
}

// Get current client data (for refreshing)
export async function getClientData() {
  const user = await getCurrentUser()
  const adminSupabase = createAdminClient()

  const { data: client } = await adminSupabase
    .from('clients')
    .select('*')
    .eq('email', user.email)
    .single()

  return client
}

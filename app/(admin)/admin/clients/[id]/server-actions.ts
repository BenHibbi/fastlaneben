'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ClientState } from '@/types/database'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    throw new Error('Unauthorized')
  }

  return user
}

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
  liveUrl: string | null
) {
  await verifyAdmin()
  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from('clients')
    .update({
      preview_url: previewUrl || null,
      live_url: liveUrl || null,
      updated_at: new Date().toISOString()
    } as never)
    .eq('id', clientId)

  if (error) {
    throw new Error('Failed to update URLs')
  }

  return { success: true }
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

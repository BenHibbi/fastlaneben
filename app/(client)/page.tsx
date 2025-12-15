import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStateRoute, STATE_CONFIG } from '@/lib/state-machine'
import type { ClientState } from '@/types/database'

export default async function ClientDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get client record by email
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email)
    .single()

  // If no client record exists, they need to start intake
  if (!client) {
    redirect('/client/intake')
  }

  // Redirect to current state page
  const route = getStateRoute(client.state as ClientState)
  redirect(route)
}

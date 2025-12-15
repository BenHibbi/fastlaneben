'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getStateRoute } from '@/lib/state-machine'
import type { ClientState, Client } from '@/types/database'

function ClientRedirectHandler() {
  const router = useRouter()

  useEffect(() => {
    const checkClientState = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || !user.email) {
        router.push('/login')
        return
      }

      // Get client record by email
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .single()

      // If no client record exists, they need to start intake
      if (!client) {
        router.push('/client/intake')
        return
      }

      const clientData = client as unknown as Client

      // Redirect to current state page
      const route = getStateRoute(clientData.state as ClientState)
      router.push(route)
    }

    checkClientState()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
    </div>
  )
}

export default function ClientDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    }>
      <ClientRedirectHandler />
    </Suspense>
  )
}

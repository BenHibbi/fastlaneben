'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client, ClientState } from '@/types/database'
import { STATE_CONFIG } from '@/lib/state-machine'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  IntakeSection,
  LockedSection,
  PreviewSection,
  ActivationSection,
  FinalOnboardingSection,
  LiveSection
} from '@/components/client/sections'
import { Fastbot } from '@/components/Fastbot'

export default function ClientSingleSurface() {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    loadClient()
  }, [])

  const loadClient = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      router.push('/login?next=/client')
      return
    }

    setUserEmail(user.email)
    setUserId(user.id)

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .single()

    if (data) {
      setClient(data as unknown as Client)
    }
    // If no client exists, they will see the intake form
    setLoading(false)
  }

  const refreshClient = async () => {
    const supabase = createClient()
    if (!userEmail) return

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (data) {
      setClient(data as unknown as Client)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  // Determine which section to show based on client state
  const state = client?.state as ClientState | undefined

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-lime-50/30 to-white">
      {/* Header - always constrained */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <a href="/" className="inline-block">
            <span className="font-serif-display font-bold italic text-2xl text-slate-900">Fastlane.</span>
          </a>
        </header>

        {/* State indicator (when client exists) */}
        {client && state && (
          <div className="mb-6 flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${
              state === 'LIVE' ? 'bg-green-100 text-green-700' :
              state === 'PREVIEW_READY' ? 'bg-purple-100 text-purple-700' :
              state === 'ACTIVATION' ? 'bg-blue-100 text-blue-700' :
              state === 'FINAL_ONBOARDING' ? 'bg-cyan-100 text-cyan-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {STATE_CONFIG[state]?.label || state}
            </span>
            {client.business_name && (
              <span className="text-slate-500">— {client.business_name}</span>
            )}
          </div>
        )}
      </div>

      {/* Content - FINAL_ONBOARDING gets full width, others constrained */}
      <div className={state === 'FINAL_ONBOARDING' ? 'px-4' : 'max-w-4xl mx-auto px-4'}>
        {!client || !state ? (
          <IntakeSection
            userEmail={userEmail!}
            userId={userId!}
            onComplete={refreshClient}
          />
        ) : state === 'LOCKED' ? (
          <LockedSection client={client} />
        ) : state === 'PREVIEW_READY' ? (
          <PreviewSection client={client} onUpdate={refreshClient} />
        ) : state === 'ACTIVATION' ? (
          <ActivationSection client={client} onUpdate={refreshClient} />
        ) : state === 'FINAL_ONBOARDING' ? (
          <FinalOnboardingSection client={client} onUpdate={refreshClient} />
        ) : state === 'LIVE' ? (
          <LiveSection client={client} />
        ) : (
          <IntakeSection
            userEmail={userEmail!}
            userId={userId!}
            onComplete={refreshClient}
          />
        )}
      </div>

      {/* Fastbot chat - hidden when site is LIVE */}
      {state !== 'LIVE' && <Fastbot />}
    </div>
  )
}

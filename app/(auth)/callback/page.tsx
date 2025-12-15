'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/client'

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient()

      // Check if we have a code (PKCE flow)
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.push(next)
          return
        }
      }

      // Check hash fragment (implicit flow from magic link)
      const hash = window.location.hash
      if (hash) {
        // The hash contains the tokens - Supabase client will pick them up automatically
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session && !error) {
          router.push(next)
          return
        }
      }

      // If no code or hash, check if already authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push(next)
        return
      }

      // Auth failed
      router.push('/login?error=auth_failed')
    }

    handleAuth()
  }, [router, searchParams, next])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-lime-50/30 to-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Signing you in...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-lime-50/30 to-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Signing you in...')
  const next = searchParams.get('next') ?? '/client'

  useEffect(() => {
    const handleAuth = async () => {
      const supabase = createClient()

      // Check for error from Supabase (in URL params)
      const error_param = searchParams.get('error')
      const error_description = searchParams.get('error_description')

      if (error_param) {
        console.log('Supabase error:', error_param, error_description)
        router.push(`/login?error=${error_param}`)
        return
      }

      // With implicit flow, tokens are in the URL hash fragment
      // The Supabase client with detectSessionInUrl: true will automatically pick them up
      setStatus('Processing authentication...')

      // Give Supabase a moment to process the hash fragment
      await new Promise(resolve => setTimeout(resolve, 500))

      // Check if session was established from hash fragment
      const { data: { session }, error } = await supabase.auth.getSession()

      console.log('Session check:', { hasSession: !!session, error: error?.message })

      if (session) {
        setStatus('Success! Redirecting...')
        router.push(next)
        return
      }

      // If no session yet, try to get user (sometimes session is delayed)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setStatus('Success! Redirecting...')
        router.push(next)
        return
      }

      // Auth failed
      console.log('No session found, redirecting to login')
      router.push('/login?error=auth_failed')
    }

    handleAuth()
  }, [router, searchParams, next])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-lime-50/30 to-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">{status}</p>
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

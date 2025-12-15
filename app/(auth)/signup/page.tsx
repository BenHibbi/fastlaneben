'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'magic' | 'password'>('magic')

  const next = searchParams.get('next') ?? '/client'

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?next=${next}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Try to sign up first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?next=${next}`,
      },
    })

    if (signUpError) {
      // If user already exists, suggest login
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        setError('This email is already registered. Please log in instead.')
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    // If email confirmation is required
    if (signUpData.user && !signUpData.session) {
      setSent(true)
      setLoading(false)
      return
    }

    // If auto-confirmed, redirect
    if (signUpData.session) {
      router.refresh()
      router.push(next)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-lime-50/30 to-white px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="font-serif-display text-3xl text-slate-900 mb-4">Check your email</h1>
          <p className="text-slate-600 mb-8">
            We sent a {mode === 'magic' ? 'magic link' : 'confirmation email'} to <span className="font-medium text-slate-900">{email}</span>
          </p>
          <p className="text-sm text-slate-400">
            Click the link in the email to {mode === 'magic' ? 'sign in and start your build' : 'confirm your account'}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-lime-50/30 to-white px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <a href="/" className="inline-block mb-6">
            <span className="font-serif-display font-bold italic text-3xl text-slate-900">Fastlane.</span>
          </a>
          <h1 className="font-serif-display text-3xl text-slate-900 mb-2">Start your build</h1>
          <p className="text-slate-500">
            Create your account to get started
          </p>
        </div>

        <form onSubmit={mode === 'password' ? handlePassword : handleMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@business.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all text-slate-900"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Create a password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all text-slate-900"
              />
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">
              {error}
              {error.includes('already registered') && (
                <a href={`/login?next=${next}`} className="block mt-2 text-slate-900 font-medium hover:text-lime-600">
                  Go to login &rarr;
                </a>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || (mode === 'password' && !password)}
            className="w-full py-3 px-4 bg-[#C3F53C] text-slate-900 rounded-xl font-bold transition-all hover:bg-[#b4e62b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : mode === 'password' ? 'Create Account' : 'Continue with Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <a href={`/login?next=${next}`} className="text-slate-900 font-medium hover:text-lime-600 transition-colors">
            Log in
          </a>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-lime-50/30 to-white">
        <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}

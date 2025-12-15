'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types/database'

export default function ActivatePage() {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadClient()
  }, [])

  const loadClient = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .single()

    if (!data) {
      router.push('/client/intake')
      return
    }

    const clientData = data as unknown as Client

    if (clientData.state !== 'ACTIVATION') {
      router.push('/client')
      return
    }

    // Pre-fill if already accepted
    if (clientData.terms_accepted_at) setTermsAccepted(true)
    if (clientData.privacy_accepted_at) setPrivacyAccepted(true)

    setClient(clientData)
    setLoading(false)
  }

  const handleCheckout = async () => {
    if (!client || !termsAccepted || !privacyAccepted) return
    setCheckoutLoading(true)
    setError('')

    const supabase = createClient()

    // Save legal consent timestamps
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', client.id)

    if (updateError) {
      setError('Failed to save consent. Please try again.')
      setCheckoutLoading(false)
      return
    }

    // Create Stripe checkout session
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to create checkout session')
        setCheckoutLoading(false)
      }
    } catch {
      setError('Failed to connect to payment system')
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) return null

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full mb-4">
          Activation
        </span>

        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
          Ready to launch?
        </h1>

        <p className="text-slate-500 text-lg">
          Start your subscription to get your site built and live.
        </p>
      </div>

      {/* Pricing card */}
      <div className="bg-slate-900 text-white rounded-2xl p-8 mb-8">
        <div className="text-center mb-6">
          <p className="text-slate-400 text-sm uppercase tracking-wide mb-2">Monthly subscription</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold">$29</span>
            <span className="text-slate-400">/month</span>
          </div>
        </div>

        <ul className="space-y-3 text-sm mb-6">
          <li className="flex items-center gap-3">
            <span className="text-[#C3F53C]">✓</span>
            Custom-built website
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#C3F53C]">✓</span>
            Unlimited support requests
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#C3F53C]">✓</span>
            Hosting & SSL included
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#C3F53C]">✓</span>
            Content updates on request
          </li>
          <li className="flex items-center gap-3">
            <span className="text-[#C3F53C]">✓</span>
            Cancel anytime
          </li>
        </ul>

        <p className="text-xs text-slate-400 text-center">
          Billed monthly. No long-term contracts.
        </p>
      </div>

      {/* Legal consent */}
      <div className="space-y-4 mb-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-[#C3F53C] focus:ring-lime-400"
          />
          <span className="text-sm text-slate-600">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-slate-900 underline hover:no-underline">
              Terms of Service
            </a>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-[#C3F53C] focus:ring-lime-400"
          />
          <span className="text-sm text-slate-600">
            I agree to the{' '}
            <a href="/privacy" target="_blank" className="text-slate-900 underline hover:no-underline">
              Privacy Policy
            </a>
          </span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm text-center mb-4">{error}</p>
      )}

      {/* Checkout button */}
      <button
        onClick={handleCheckout}
        disabled={!termsAccepted || !privacyAccepted || checkoutLoading}
        className="w-full px-8 py-4 bg-[#C3F53C] text-slate-900 rounded-xl font-bold text-lg transition-all hover:bg-[#b4e62b] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checkoutLoading ? 'Redirecting to payment...' : 'Subscribe & Continue →'}
      </button>

      <p className="text-xs text-slate-400 text-center mt-4">
        Secure payment powered by Stripe
      </p>
    </div>
  )
}

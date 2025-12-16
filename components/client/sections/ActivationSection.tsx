'use client'

import { useState } from 'react'
import type { Client } from '@/types/database'

interface ActivationSectionProps {
  client: Client
  onUpdate: () => void
}

export function ActivationSection({ client, onUpdate }: ActivationSectionProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    if (!termsAccepted) {
      setError('Please accept the terms to continue.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎉</span>
        </div>

        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
          Let&apos;s make it official
        </h1>

        <p className="text-slate-500 text-lg">
          You are one step away from having your site live.
        </p>
      </div>

      {/* Pricing card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-medium text-slate-900">Fastlane Website</h2>
            <p className="text-sm text-slate-500">Everything you need to get online</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">$99<span className="text-sm font-normal text-slate-500">/mo</span></p>
          </div>
        </div>

        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Custom-designed website
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Hosting & SSL included
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Mobile optimized
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Unlimited edits
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Analytics dashboard
          </li>
        </ul>
      </div>

      {/* Terms checkbox */}
      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-slate-300 text-lime-500 focus:ring-lime-400"
        />
        <span className="text-sm text-slate-600">
          I agree to the{' '}
          <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </span>
      </label>

      {/* Error */}
      {error && (
        <p className="mb-4 text-red-500 text-sm">{error}</p>
      )}

      {/* CTA */}
      <button
        onClick={handleCheckout}
        disabled={loading || !termsAccepted}
        className="w-full px-8 py-4 bg-[#C3F53C] text-slate-900 rounded-xl font-bold text-lg transition-all hover:bg-[#b4e62b] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirecting to checkout...' : 'Subscribe & Go Live'}
      </button>

      <p className="text-sm text-slate-400 text-center mt-4">
        Cancel anytime. No questions asked.
      </p>
    </div>
  )
}

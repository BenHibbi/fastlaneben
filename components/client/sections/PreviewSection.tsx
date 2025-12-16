'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types/database'

interface PreviewSectionProps {
  client: Client
  onUpdate: () => void
}

export function PreviewSection({ client, onUpdate }: PreviewSectionProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [scopeUnderstood, setScopeUnderstood] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const screenshots = (client.preview_screenshots || []) as string[]

  const handleSubscribe = async () => {
    if (!scopeUnderstood || !termsAccepted) {
      setError('Please accept both checkboxes to continue.')
      return
    }

    setSubmitting(true)
    setError('')

    const supabase = createClient()

    // 1. Record terms acceptance
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        terms_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', client.id)

    if (updateError) {
      setError('Failed to process. Please try again.')
      setSubmitting(false)
      return
    }

    // 2. Redirect to Stripe checkout
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
          Your preview is ready!
        </h1>
        <p className="text-slate-500 text-lg">
          Review your website design below. Love it? Subscribe to make it live.
        </p>
        <div className="mt-4 mx-auto max-w-xl p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> This is an example of what could be done. Of course, feel free to tell us if you&apos;d like something different once you subscribe.
          </p>
        </div>
      </div>

      {/* Mockup display */}
      {screenshots.length > 0 ? (
        <div className="space-y-4 mb-8">
          {screenshots.map((url, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      ) : client.preview_url ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center mb-8">
          <p className="text-slate-600 mb-4">View your preview site:</p>
          <a
            href={client.preview_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            {client.preview_url}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl p-8 text-center mb-8">
          <p className="text-slate-500">No preview available yet.</p>
        </div>
      )}

      {/* Subscription card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="text-center mb-6">
          <p className="text-3xl font-bold text-slate-900">$39<span className="text-lg font-normal text-slate-500">/month</span></p>
          <p className="text-slate-500 text-sm mt-1">Cancel anytime</p>
        </div>

        {/* What's included */}
        <div className="mb-6">
          <h3 className="font-medium text-slate-900 mb-3">What&apos;s included:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              A custom-designed website tailored to your business
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              1 page (scrollable sections)
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Hosting included (no extra cost)
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mobile-optimized
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              1 round of revisions
            </li>
            <li className="flex items-center gap-3 text-slate-700 text-sm">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Basic email support
            </li>
          </ul>
        </div>

        {/* What's NOT included */}
        <div className="mb-6">
          <h3 className="font-medium text-slate-900 mb-3">What&apos;s NOT included:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-3 text-slate-500 text-sm">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Ongoing changes after launch
            </li>
            <li className="flex items-center gap-3 text-slate-500 text-sm">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Unlimited revisions (only 1 round)
            </li>
            <li className="flex items-center gap-3 text-slate-500 text-sm">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Additional pages (just 1)
            </li>
            <li className="flex items-center gap-3 text-slate-500 text-sm">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Marketing or SEO services
            </li>
            <li className="flex items-center gap-3 text-slate-500 text-sm">
              <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Live calls (everything is async via text/email)
            </li>
          </ul>
        </div>

        {/* Important conditions */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h3 className="font-medium text-amber-900 mb-2">Important:</h3>
          <ul className="space-y-1.5 text-sm text-amber-800">
            <li>- The mockup above is free. You only pay when you approve.</li>
            <li>- Your site will be live within 7 days of subscribing.</li>
            <li>- You get 48h to request revisions after receiving the final preview.</li>
            <li>- If you don&apos;t respond within 48h, the site goes live automatically.</li>
            <li>- Cancel anytime. If you cancel, the site goes offline.</li>
            <li>- You do not own the code or design (it stays on our platform).</li>
          </ul>
        </div>

        {/* Scope understood checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={scopeUnderstood}
            onChange={(e) => setScopeUnderstood(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-lime-500 focus:ring-lime-400"
          />
          <span className="text-sm text-slate-600">
            I understand this is a fixed-scope service with limited revisions and no ongoing changes included.
          </span>
        </label>

        {/* Terms checkbox */}
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-300 text-lime-500 focus:ring-lime-400"
          />
          <span className="text-sm text-slate-600">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a>
          </span>
        </label>

        {/* Error */}
        {error && (
          <p className="mb-4 text-red-500 text-sm text-center">{error}</p>
        )}

        {/* Subscribe button */}
        <button
          onClick={handleSubscribe}
          disabled={submitting || !termsAccepted || !scopeUnderstood}
          className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            termsAccepted && scopeUnderstood
              ? 'bg-[#C3F53C] text-slate-900 hover:bg-[#b4e62b]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {submitting ? 'Redirecting to checkout...' : 'Subscribe - $39/month'}
        </button>

      </div>

      <p className="text-center text-xs text-slate-400">
        Secure payment powered by Stripe
      </p>
    </div>
  )
}

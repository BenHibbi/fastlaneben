'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client, ClientState } from '@/types/database'
import { STATE_CONFIG } from '@/lib/state-machine'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  submitIntake,
  approvePreview,
  requestRevision,
  saveFinalContent,
  uploadClientFile
} from './actions'

// ============================================================================
// CONSTANTS
// ============================================================================

const INDUSTRIES = [
  'Restaurant / Café',
  'Contractor / Trades',
  'Salon / Spa',
  'Retail / Shop',
  'Professional Services',
  'Health / Wellness',
  'Real Estate',
  'Creative / Agency',
  'Other'
]

const GOALS = [
  'Get more phone calls',
  'Showcase my portfolio',
  'Book appointments online',
  'Build credibility',
  'Sell products',
  'Other'
]

const STYLES = [
  'Clean & Minimal',
  'Bold & Modern',
  'Warm & Friendly',
  'Professional & Corporate',
  'Creative & Unique'
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
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

        {/* Render section based on state */}
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
    </div>
  )
}

// ============================================================================
// INTAKE SECTION (New clients or INTAKE state)
// ============================================================================

function IntakeSection({
  userEmail,
  userId,
  onComplete
}: {
  userEmail: string
  userId: string
  onComplete: () => void
}) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    industry_other: '',
    location: '',
    goal: '',
    goal_other: '',
    style: '',
    description: '',
    competitors: ''
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const intakeData = {
        goal: formData.goal,
        goal_other: formData.goal_other,
        industry_other: formData.industry_other,
        style: formData.style,
        description: formData.description,
        competitors: formData.competitors.split('\n').filter(Boolean)
      }

      await submitIntake({
        business_name: formData.business_name,
        industry: formData.industry,
        location: formData.location,
        intake_data: intakeData
      })

      onComplete()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.business_name.trim() !== ''
      case 2:
        if (formData.industry === 'Other') {
          return formData.industry_other.trim() !== ''
        }
        return formData.industry !== ''
      case 3:
        return formData.location.trim() !== ''
      case 4:
        if (formData.goal === 'Other') {
          return formData.goal_other.trim() !== ''
        }
        return formData.goal !== ''
      case 5:
        return formData.style !== ''
      default:
        return true
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                s === step
                  ? 'bg-[#C3F53C] text-slate-900'
                  : s < step
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C3F53C] transition-all duration-500"
            style={{ width: `${((step - 1) / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Business Name */}
      {step === 1 && (
        <div className="animate-blur-fade">
          <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
            What&apos;s your business called?
          </h1>
          <p className="text-slate-500 mb-8">This will be featured prominently on your site.</p>
          <input
            type="text"
            value={formData.business_name}
            onChange={(e) => updateField('business_name', e.target.value)}
            placeholder="e.g., Precision Plumbing"
            className="w-full px-4 py-4 text-xl border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
            autoFocus
          />
        </div>
      )}

      {/* Step 2: Industry */}
      {step === 2 && (
        <div className="animate-blur-fade">
          <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
            What industry are you in?
          </h1>
          <p className="text-slate-500 mb-8">This helps us design something perfect for your field.</p>
          <div className="grid gap-3">
            {INDUSTRIES.map((industry) => (
              <button
                key={industry}
                onClick={() => {
                  updateField('industry', industry)
                  // Auto-advance unless "Other" is selected
                  if (industry !== 'Other') {
                    setTimeout(() => setStep(step + 1), 150)
                  }
                }}
                className={`w-full p-4 text-left rounded-xl border transition-all ${
                  formData.industry === industry
                    ? 'border-lime-400 bg-lime-50 text-slate-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {industry}
              </button>
            ))}
          </div>
          {formData.industry === 'Other' && (
            <input
              type="text"
              value={formData.industry_other}
              onChange={(e) => updateField('industry_other', e.target.value)}
              placeholder="Please specify your industry"
              className="mt-4 w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
              autoFocus
            />
          )}
        </div>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <div className="animate-blur-fade">
          <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
            Where are you located?
          </h1>
          <p className="text-slate-500 mb-8">City and state/region for local SEO.</p>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="e.g., Seattle, WA"
            className="w-full px-4 py-4 text-xl border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
            autoFocus
          />
        </div>
      )}

      {/* Step 4: Goal */}
      {step === 4 && (
        <div className="animate-blur-fade">
          <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
            What&apos;s the main goal of your website?
          </h1>
          <p className="text-slate-500 mb-8">This shapes how we structure your site.</p>
          <div className="grid gap-3">
            {GOALS.map((goal) => (
              <button
                key={goal}
                onClick={() => {
                  updateField('goal', goal)
                  // Auto-advance unless "Other" is selected
                  if (goal !== 'Other') {
                    setTimeout(() => setStep(step + 1), 150)
                  }
                }}
                className={`w-full p-4 text-left rounded-xl border transition-all ${
                  formData.goal === goal
                    ? 'border-lime-400 bg-lime-50 text-slate-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
          {formData.goal === 'Other' && (
            <input
              type="text"
              value={formData.goal_other}
              onChange={(e) => updateField('goal_other', e.target.value)}
              placeholder="Please specify your goal"
              className="mt-4 w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
              autoFocus
            />
          )}
        </div>
      )}

      {/* Step 5: Style */}
      {step === 5 && (
        <div className="animate-blur-fade">
          <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
            What style resonates with you?
          </h1>
          <p className="text-slate-500 mb-8">We will use this as a starting point for your design.</p>
          <div className="grid gap-3">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => {
                  updateField('style', style)
                  // Auto-advance to next step
                  setTimeout(() => setStep(step + 1), 150)
                }}
                className={`w-full p-4 text-left rounded-xl border transition-all ${
                  formData.style === style
                    ? 'border-lime-400 bg-lime-50 text-slate-900'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 6: Additional Info */}
      {step === 6 && (
        <div className="animate-blur-fade">
          <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
            Anything else we should know?
          </h1>
          <p className="text-slate-500 mb-8">Optional — but helpful!</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Brief description of your business
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="What makes your business special?"
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Websites you like (one per line)
              </label>
              <textarea
                value={formData.competitors}
                onChange={(e) => updateField('competitors', e.target.value)}
                placeholder="https://example.com"
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-4 text-red-500 text-sm">{error}</p>
      )}

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 text-slate-600 font-medium hover:text-slate-900 transition-colors"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < 6 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-8 py-3 bg-[#C3F53C] text-slate-900 rounded-xl font-bold transition-all hover:bg-[#b4e62b] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit & Generate Preview'}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// LOCKED SECTION (Waiting for preview)
// ============================================================================

function LockedSection({ client }: { client: Client }) {
  const intakeData = client.intake_data as Record<string, unknown> | null

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Animated loading */}
      <div className="mb-8">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#C3F53C] border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🚀</span>
          </div>
        </div>
      </div>

      <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
        Your preview is being built
      </h1>

      <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
        We are crafting something beautiful for {client.business_name}. You will get notified when it is ready to review.
      </p>

      {/* Summary card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left mb-8">
        <h2 className="font-medium text-slate-900 mb-4">Your submission</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Business</dt>
            <dd className="font-medium text-slate-900">{client.business_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Industry</dt>
            <dd className="font-medium text-slate-900">
              {client.industry}
              {client.industry === 'Other' && typeof intakeData?.industry_other === 'string' && (
                <span className="text-slate-600"> — {intakeData.industry_other}</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Location</dt>
            <dd className="font-medium text-slate-900">{client.location}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Style</dt>
            <dd className="font-medium text-slate-900">{intakeData?.style as string || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Goal</dt>
            <dd className="font-medium text-slate-900">
              {intakeData?.goal as string || '—'}
              {intakeData?.goal === 'Other' && typeof intakeData?.goal_other === 'string' && (
                <span className="text-slate-600"> — {intakeData.goal_other}</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <p className="text-sm text-slate-400">
        We typically deliver previews within 24-48 hours.
      </p>
    </div>
  )
}

// ============================================================================
// PREVIEW SECTION (Review mockup + Direct Stripe checkout)
// ============================================================================

function PreviewSection({
  client,
  onUpdate
}: {
  client: Client
  onUpdate: () => void
}) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showRevisionModal, setShowRevisionModal] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [error, setError] = useState('')

  const screenshots = (client.preview_screenshots || []) as string[]
  const revisionsRemaining = (client.revisions_remaining as number) ?? 2

  const handleApproveAndCheckout = async () => {
    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // 1. Approve preview - transitions to ACTIVATION state
      await approvePreview(client.id)

      // 2. Redirect to Stripe checkout
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setSubmitting(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      setError('Please describe what changes you would like.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await requestRevision(client.id, revisionNotes)
      setShowRevisionModal(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request revision')
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

        {/* Features */}
        <ul className="space-y-3 mb-6">
          <li className="flex items-center gap-3 text-slate-700">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Custom design for your business
          </li>
          <li className="flex items-center gap-3 text-slate-700">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Hosting & SSL included
          </li>
          <li className="flex items-center gap-3 text-slate-700">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mobile optimized
          </li>
          <li className="flex items-center gap-3 text-slate-700">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Ongoing updates & support
          </li>
        </ul>

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
          onClick={handleApproveAndCheckout}
          disabled={submitting || !termsAccepted}
          className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            termsAccepted
              ? 'bg-[#C3F53C] text-slate-900 hover:bg-[#b4e62b]'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          } disabled:opacity-50`}
        >
          {submitting ? 'Redirecting to checkout...' : 'Subscribe - $39/month'}
        </button>
      </div>

      {/* Revision option */}
      {revisionsRemaining > 0 && (
        <div className="text-center mb-6">
          <p className="text-sm text-slate-500 mb-2">
            Not quite right? You have {revisionsRemaining} revision{revisionsRemaining !== 1 ? 's' : ''} remaining.
          </p>
          <button
            onClick={() => setShowRevisionModal(true)}
            disabled={submitting}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
          >
            Request changes
          </button>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Secure payment powered by Stripe
      </p>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-medium text-slate-900 text-lg mb-4">Request Revision</h3>
            <p className="text-sm text-slate-500 mb-4">
              Describe what changes you would like to see. Our team will review and update your preview.
            </p>
            <textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="e.g., I would like a different color scheme, or could you make the header larger?"
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none mb-4"
            />
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRevisionModal(false)
                  setRevisionNotes('')
                  setError('')
                }}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ACTIVATION SECTION (Stripe checkout)
// ============================================================================

function ActivationSection({
  client,
  onUpdate
}: {
  client: Client
  onUpdate: () => void
}) {
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

// ============================================================================
// FINAL ONBOARDING SECTION (Content & images)
// ============================================================================

const MAX_PHOTOS = 6

function FinalOnboardingSection({
  client,
  onUpdate
}: {
  client: Client
  onUpdate: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    tagline: '',
    about: '',
    detailed_description: '',
    services: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    social_links: '',
    call_to_action: ''
  })

  const [uploadedImages, setUploadedImages] = useState<string[]>([])

  // Initialize from existing data
  useEffect(() => {
    if (client.final_content && typeof client.final_content === 'object') {
      const content = client.final_content as Record<string, string>
      setFormData({
        tagline: content.tagline || '',
        about: content.about || '',
        detailed_description: content.detailed_description || '',
        services: content.services || '',
        contact_email: content.contact_email || '',
        contact_phone: content.contact_phone || '',
        address: content.address || '',
        social_links: content.social_links || '',
        call_to_action: content.call_to_action || ''
      })
    }

    if (client.final_images && Array.isArray(client.final_images)) {
      setUploadedImages(client.final_images as string[])
    }
  }, [client])

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Limit to remaining slots
    const remainingSlots = MAX_PHOTOS - uploadedImages.length
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_PHOTOS} photos allowed`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    setUploading(true)
    setError('')

    const newUrls: string[] = []

    for (const file of filesToUpload) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const { url } = await uploadClientFile(client.id, formData)
        newUrls.push(url)
      } catch {
        setError(`Failed to upload ${file.name}`)
      }
    }

    setUploadedImages(prev => [...prev, ...newUrls].slice(0, MAX_PHOTOS))
    setUploading(false)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const canSubmit = () => {
    const requiredFields = ['tagline', 'about', 'detailed_description', 'services', 'contact_email']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim())
    return missingFields.length === 0 && uploadedImages.length > 0
  }

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = ['tagline', 'about', 'detailed_description', 'services', 'contact_email']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim())

    if (missingFields.length > 0) {
      setError('Please fill in all required fields (marked with *)')
      return
    }

    if (uploadedImages.length === 0) {
      setError('Please upload at least one photo')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      await saveFinalContent(client.id, formData, uploadedImages)
      alert('Content saved! We will notify you when your site is live.')
      onUpdate()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
          Let&apos;s finalize your content
        </h1>
        <p className="text-slate-500 text-lg">
          Add all the text and images you want on your site.
        </p>
        <p className="text-sm text-slate-400 mt-2">
          Fields marked with <span className="text-red-500">*</span> are required
        </p>
      </div>

      <div className="space-y-6">
        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tagline / Headline <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            placeholder="e.g., Quality work you can trust"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
          />
          <p className="text-xs text-slate-400 mt-1">The main headline visitors will see first</p>
        </div>

        {/* About */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            About your business <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.about}
            onChange={(e) => updateField('about', e.target.value)}
            placeholder="Tell visitors about who you are, your story, what makes you different..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">This will be the &quot;About&quot; section of your site</p>
        </div>

        {/* Detailed description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Detailed description for us <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.detailed_description}
            onChange={(e) => updateField('detailed_description', e.target.value)}
            placeholder="Tell us more about your vision: What makes your business unique? What feeling should your site convey? Any specific features you need? Who are your ideal customers?"
            rows={5}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">This helps us build exactly what you need (not displayed on site)</p>
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Services / Products <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.services}
            onChange={(e) => updateField('services', e.target.value)}
            placeholder="List your main services or products with short descriptions...&#10;&#10;Example:&#10;- Kitchen renovation: Full kitchen remodeling from design to installation&#10;- Bathroom renovation: Modern bathroom upgrades&#10;- Custom carpentry: Built-in shelving and custom furniture"
            rows={5}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none"
          />
        </div>

        {/* Call to action */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Call to Action
          </label>
          <input
            type="text"
            value={formData.call_to_action}
            onChange={(e) => updateField('call_to_action', e.target.value)}
            placeholder="e.g., Get a Free Quote, Book a Consultation, Contact Us Today"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
          />
          <p className="text-xs text-slate-400 mt-1">The text on your main button</p>
        </div>

        {/* Contact info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => updateField('contact_email', e.target.value)}
              placeholder="hello@yourbusiness.com"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => updateField('contact_phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Business Address
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="123 Main Street, City, State 12345"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
          />
        </div>

        {/* Social links */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Social Media Links
          </label>
          <textarea
            value={formData.social_links}
            onChange={(e) => updateField('social_links', e.target.value)}
            placeholder="One per line:&#10;https://instagram.com/yourbusiness&#10;https://facebook.com/yourbusiness"
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none font-mono text-sm"
          />
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Photos for your site <span className="text-red-500">*</span>
            <span className="ml-2 text-slate-400 font-normal">
              ({uploadedImages.length}/{MAX_PHOTOS} max)
            </span>
          </label>
          <p className="text-sm text-slate-500 mb-3">
            Upload up to {MAX_PHOTOS} photos: your logo, photos of your work, team, storefront, or products.
          </p>

          {/* Photo slots grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
              <div key={i} className="relative aspect-square">
                {uploadedImages[i] ? (
                  <div className="relative group w-full h-full">
                    <img
                      src={uploadedImages[i]}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg border border-slate-200"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-xs">Photo {i + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload button */}
          {uploadedImages.length < MAX_PHOTOS && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-lime-400 hover:bg-lime-50/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <p className="text-slate-600 font-medium">
                  {uploading ? 'Uploading...' : '+ Add photos'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP up to 10MB each</p>
              </label>
            </div>
          )}

          {uploadedImages.length === 0 && (
            <p className="text-amber-600 text-sm mt-2">
              Please upload at least one photo
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-4 text-red-500 text-sm">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full mt-8 px-8 py-4 bg-[#C3F53C] text-slate-900 rounded-xl font-bold text-lg transition-all hover:bg-[#b4e62b] disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save & Submit Content'}
      </button>

      <p className="text-sm text-slate-400 text-center mt-4">
        You can update this anytime before your site goes live.
      </p>
    </div>
  )
}

// ============================================================================
// LIVE SECTION (Dashboard)
// ============================================================================

function LiveSection({ client }: { client: Client }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎉</span>
        </div>

        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
          Your site is live!
        </h1>

        <p className="text-slate-500 text-lg">
          Congratulations! Your website is now accessible to the world.
        </p>
      </div>

      {/* Site URL card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="font-medium text-slate-900 mb-3">Your website</h2>
        {client.live_url ? (
          <a
            href={client.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-lg break-all"
          >
            {client.live_url}
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          <p className="text-slate-500">URL will be available soon</p>
        )}
      </div>

      {/* Quick stats placeholder */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">—</p>
          <p className="text-sm text-slate-500">Visitors</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">—</p>
          <p className="text-sm text-slate-500">Page views</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">Active</p>
          <p className="text-sm text-slate-500">Status</p>
        </div>
      </div>

      {/* Support section */}
      <div className="bg-slate-50 rounded-2xl p-6">
        <h2 className="font-medium text-slate-900 mb-2">Need help?</h2>
        <p className="text-slate-500 text-sm mb-4">
          Our team is here to help with any updates or questions.
        </p>
        <a
          href="/client/support"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
        >
          Contact Support
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </a>
      </div>

      {/* Subscription info */}
      {client.subscription_status && (
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Subscription: <span className={`font-medium ${
              client.subscription_status === 'active' ? 'text-green-600' : 'text-amber-600'
            }`}>{client.subscription_status}</span>
          </p>
        </div>
      )}
    </div>
  )
}

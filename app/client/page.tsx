'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client, ClientState, OnboardingPhase } from '@/types/database'
import { STATE_CONFIG } from '@/lib/state-machine'
import { ONBOARDING_PHASE_CONFIG } from '@/types/database'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  VoiceBriefRecorder,
  ReferenceScreenshots,
  ReactPreviewRenderer,
  RevisionRequestForm
} from '@/components/client'

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

    const supabase = createClient()

    // Check if client already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, state')
      .eq('email', userEmail)
      .single()

    const intakeData = {
      goal: formData.goal,
      goal_other: formData.goal_other,
      industry_other: formData.industry_other,
      style: formData.style,
      description: formData.description,
      competitors: formData.competitors.split('\n').filter(Boolean)
    }

    if (existingClient) {
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          business_name: formData.business_name,
          industry: formData.industry,
          location: formData.location,
          intake_data: intakeData,
          state: 'LOCKED',
          state_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', (existingClient as { id: string }).id)

      if (updateError) {
        setError('Failed to submit. Please try again.')
        setLoading(false)
        return
      }

      const existingClientData = existingClient as { id: string; state: string }
      await supabase.from('state_transitions').insert({
        client_id: existingClientData.id,
        from_state: existingClientData.state,
        to_state: 'LOCKED',
        triggered_by: userId,
        trigger_type: 'CLIENT',
        metadata: { action: 'intake_submitted' }
      } as never)
    } else {
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          email: userEmail,
          business_name: formData.business_name,
          industry: formData.industry,
          location: formData.location,
          intake_data: intakeData,
          state: 'LOCKED'
        } as never)
        .select()
        .single()

      if (insertError) {
        setError('Failed to submit. Please try again.')
        setLoading(false)
        return
      }

      const newClientData = newClient as { id: string }
      await supabase.from('state_transitions').insert({
        client_id: newClientData.id,
        from_state: null,
        to_state: 'LOCKED',
        triggered_by: userId,
        trigger_type: 'CLIENT',
        metadata: { action: 'intake_submitted' }
      } as never)
    }

    setLoading(false)
    onComplete()
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

        {/* DEV ONLY: Skip payment button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={async () => {
              setSubmitting(true)
              const supabase = createClient()
              await supabase
                .from('clients')
                .update({
                  state: 'FINAL_ONBOARDING',
                  state_changed_at: new Date().toISOString(),
                  terms_accepted_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                } as never)
                .eq('id', client.id)
              onUpdate()
            }}
            disabled={submitting}
            className="w-full mt-3 px-4 py-2 border-2 border-dashed border-orange-300 text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-50 transition-colors"
          >
            Skip Payment (Dev Only)
          </button>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        Secure payment powered by Stripe
      </p>
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
// PHASE PROGRESS INDICATOR
// ============================================================================

function PhaseProgress({
  phases,
  currentPhase,
  completedPhases = [],
  onPrevious,
  onNext
}: {
  phases: OnboardingPhase[]
  currentPhase: OnboardingPhase
  completedPhases?: OnboardingPhase[]
  onPrevious?: () => void
  onNext?: () => void
}) {
  const currentIndex = phases.indexOf(currentPhase)
  const canGoPrevious = currentIndex > 0 && onPrevious
  const canGoNext = onNext && completedPhases.includes(phases[currentIndex])

  return (
    <div className="mb-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4">
        {phases.map((phase, index) => {
          const isCompleted = completedPhases.includes(phase) || index < currentIndex
          const isCurrent = index === currentIndex
          const config = ONBOARDING_PHASE_CONFIG[phase]

          return (
            <div key={phase} className="flex items-center flex-1">
              {/* Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    isCurrent ? 'text-slate-900 font-medium' : 'text-slate-400'
                  }`}
                >
                  {config.label}
                </span>
              </div>

              {/* Connector line */}
              {index < phases.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Navigation and description */}
      <div className="flex items-center justify-between">
        {/* Previous button */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            canGoPrevious
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Current phase description */}
        <p className="text-sm text-slate-500">
          Step {currentIndex + 1} of {phases.length}:{' '}
          <span className="font-medium text-slate-700">
            {ONBOARDING_PHASE_CONFIG[currentPhase].description}
          </span>
        </p>

        {/* Next button */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            canGoNext
              ? 'text-slate-600 hover:bg-slate-100'
              : 'text-slate-300 cursor-not-allowed'
          }`}
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// FINAL ONBOARDING SECTION (Multi-phase: Voice Brief → References → Content → Preview → Revisions)
// ============================================================================

const MAX_PHOTOS = 6

function FinalOnboardingSection({
  client,
  onUpdate
}: {
  client: Client
  onUpdate: () => void
}) {
  // Determine current phase from client data
  const getInitialPhase = (): OnboardingPhase => {
    // Check if onboarding_phase is explicitly set
    const savedPhase = client.onboarding_phase as OnboardingPhase | null

    // If in building phase, stay there
    if (savedPhase === 'building') return 'building'

    // If there's an active React preview, show it
    if (client.current_react_preview_id) {
      return savedPhase === 'revisions' ? 'revisions' : 'react_preview'
    }
    // Check creative brief status
    const briefStatus = client.creative_brief_status || 'not_started'
    if (briefStatus === 'not_started') return 'voice_brief'
    if (briefStatus === 'voice_recorded') return 'voice_brief' // Still needs analysis
    if (briefStatus === 'brief_generated') return 'references'
    // Default to content if brief is complete
    return savedPhase || 'content'
  }

  const [phase, setPhase] = useState<OnboardingPhase>(getInitialPhase())
  const [showRevisionForm, setShowRevisionForm] = useState(false)

  // Re-calculate phase when client updates
  useEffect(() => {
    const newPhase = getInitialPhase()
    // Always sync to building phase if content was just submitted
    if (newPhase === 'building' && phase === 'content') {
      setPhase('building')
    }
    // Only auto-advance if we're at an earlier phase
    if (
      newPhase === 'react_preview' &&
      (phase === 'voice_brief' || phase === 'references' || phase === 'content' || phase === 'building')
    ) {
      setPhase('react_preview')
    }
  }, [client])

  // Content form state (for the 'content' phase)
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

    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop()
      const path = `${client.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(path, file)

      if (uploadError) {
        setError(`Failed to upload ${file.name}`)
        continue
      }

      // Use signed URL (1 year) since bucket may not be public
      const { data: signedUrlData } = await supabase.storage
        .from('client-files')
        .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 year

      if (signedUrlData?.signedUrl) {
        newUrls.push(signedUrlData.signedUrl)
      } else {
        // Fallback to public URL
        const { data: { publicUrl } } = supabase.storage
          .from('client-files')
          .getPublicUrl(path)
        newUrls.push(publicUrl)
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

  // Validation helpers
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const validateSocialLinks = (links: string) => {
    if (!links.trim()) return true // Optional field
    const urls = links.split('\n').filter(l => l.trim())
    return urls.every(url => isValidUrl(url.trim()))
  }

  const canSubmit = () => {
    const requiredFields = ['tagline', 'about', 'detailed_description', 'services', 'contact_email']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim())
    const emailValid = isValidEmail(formData.contact_email)
    const socialValid = validateSocialLinks(formData.social_links)
    return missingFields.length === 0 && uploadedImages.length > 0 && emailValid && socialValid
  }

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = ['tagline', 'about', 'detailed_description', 'services', 'contact_email']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim())

    if (missingFields.length > 0) {
      setError('Please fill in all required fields (marked with *)')
      return
    }

    // Validate email format
    if (!isValidEmail(formData.contact_email)) {
      setError('Please enter a valid email address')
      return
    }

    // Validate social links format
    if (!validateSocialLinks(formData.social_links)) {
      setError('Please enter valid URLs for social media links (one per line, starting with https://)')
      return
    }

    if (uploadedImages.length === 0) {
      setError('Please upload at least one photo')
      return
    }

    setSubmitting(true)
    setError('')

    const supabase = createClient()

    // Update content and transition to BUILDING state
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        final_content: formData,
        final_images: uploadedImages,
        onboarding_phase: 'building',
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', client.id)

    if (updateError) {
      setError('Failed to save. Please try again.')
      setSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('state_transitions').insert({
      client_id: client.id,
      from_state: 'FINAL_ONBOARDING',
      to_state: 'FINAL_ONBOARDING',
      triggered_by: user?.id,
      trigger_type: 'CLIENT',
      metadata: { action: 'final_content_submitted' }
    } as never)

    setSubmitting(false)
    setPhase('building')
    onUpdate()
  }

  // Phase progress indicator
  const phases: OnboardingPhase[] = ['voice_brief', 'references', 'content', 'building', 'react_preview', 'revisions']
  const currentPhaseIndex = phases.indexOf(phase)

  // Calculate completed phases based on client data
  const getCompletedPhases = (): OnboardingPhase[] => {
    const completed: OnboardingPhase[] = []
    const briefStatus = client.creative_brief_status || 'not_started'

    // Voice brief is complete if status is at least 'brief_generated' or 'complete'
    if (briefStatus === 'brief_generated' || briefStatus === 'complete') {
      completed.push('voice_brief')
    }

    // References is complete if status is 'complete'
    if (briefStatus === 'complete') {
      completed.push('references')
    }

    // Content is complete if final_content exists and has required fields
    if (client.final_content && typeof client.final_content === 'object') {
      const content = client.final_content as Record<string, string>
      if (content.tagline && content.about && content.services && content.contact_email) {
        completed.push('content')
      }
    }

    // Building is complete if we have a react preview
    if (client.current_react_preview_id) {
      completed.push('building')
    }

    // React preview is always navigable once available
    if (client.current_react_preview_id) {
      completed.push('react_preview')
    }

    return completed
  }

  const completedPhases = getCompletedPhases()

  // Navigation handlers
  const goToPreviousPhase = () => {
    if (currentPhaseIndex > 0) {
      setPhase(phases[currentPhaseIndex - 1])
    }
  }

  const goToNextPhase = () => {
    if (currentPhaseIndex < phases.length - 1) {
      setPhase(phases[currentPhaseIndex + 1])
    }
  }

  // Render phase-specific content
  if (phase === 'voice_brief') {
    return (
      <div className="max-w-2xl mx-auto">
        <PhaseProgress
          phases={phases}
          currentPhase={phase}
          completedPhases={completedPhases}
          onNext={completedPhases.includes('voice_brief') ? goToNextPhase : undefined}
        />
        <VoiceBriefRecorder
          client={client}
          onComplete={() => setPhase('references')}
          onUpdate={onUpdate}
        />
      </div>
    )
  }

  if (phase === 'references') {
    return (
      <div className="max-w-2xl mx-auto">
        <PhaseProgress
          phases={phases}
          currentPhase={phase}
          completedPhases={completedPhases}
          onPrevious={goToPreviousPhase}
          onNext={completedPhases.includes('references') ? goToNextPhase : undefined}
        />
        <ReferenceScreenshots
          client={client}
          onComplete={() => setPhase('content')}
          onUpdate={onUpdate}
        />
      </div>
    )
  }

  // Handler for when revisions are submitted
  const handleRevisionSubmitted = () => {
    setShowRevisionForm(false)
    setPhase('building')
  }

  if (phase === 'react_preview') {
    if (showRevisionForm) {
      return (
        <div className="max-w-2xl mx-auto">
          <PhaseProgress
            phases={phases}
            currentPhase="revisions"
            completedPhases={completedPhases}
            onPrevious={() => setShowRevisionForm(false)}
          />
          <RevisionRequestForm
            client={client}
            onBack={() => setShowRevisionForm(false)}
            onUpdate={onUpdate}
            onSubmitted={handleRevisionSubmitted}
          />
        </div>
      )
    }
    return (
      <div className="w-full">
        <div className="max-w-4xl mx-auto">
          <PhaseProgress
            phases={phases}
            currentPhase={phase}
            completedPhases={completedPhases}
            onPrevious={goToPreviousPhase}
          />
        </div>
        <ReactPreviewRenderer
          client={client}
          onRequestRevision={() => setShowRevisionForm(true)}
        />
      </div>
    )
  }

  if (phase === 'revisions') {
    return (
      <div className="max-w-2xl mx-auto">
        <PhaseProgress
          phases={phases}
          currentPhase={phase}
          completedPhases={completedPhases}
          onPrevious={() => setPhase('react_preview')}
        />
        <RevisionRequestForm
          client={client}
          onBack={() => setPhase('react_preview')}
          onUpdate={onUpdate}
          onSubmitted={handleRevisionSubmitted}
        />
      </div>
    )
  }

  if (phase === 'building') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-100 text-lime-700 rounded-full text-sm font-medium mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500"></span>
            </span>
            Building in progress
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
            We&apos;re building your site!
          </h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            Our team is crafting something beautiful for {client.business_name || 'your business'}. We&apos;ll notify you when it&apos;s ready to review.
          </p>
        </div>

        {/* Animated mockup preview */}
        <div className="relative">
          {/* Browser window mockup */}
          <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 bg-slate-700 rounded-lg px-4 py-1.5 text-xs text-slate-400 text-center">
                {client.business_name?.toLowerCase().replace(/\s+/g, '') || 'your-site'}.com
              </div>
            </div>

            {/* Website content with animation */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-8 min-h-[400px] relative overflow-hidden">
              {/* Animated skeleton elements */}
              <div className="space-y-6 animate-pulse">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
                  <div className="flex gap-4">
                    <div className="h-4 w-16 bg-slate-200 rounded"></div>
                    <div className="h-4 w-16 bg-slate-200 rounded"></div>
                    <div className="h-4 w-16 bg-slate-200 rounded"></div>
                  </div>
                </div>

                {/* Hero */}
                <div className="py-12 text-center space-y-4">
                  <div className="h-10 w-3/4 bg-slate-200 rounded-lg mx-auto"></div>
                  <div className="h-6 w-1/2 bg-slate-200 rounded mx-auto"></div>
                  <div className="h-12 w-40 bg-lime-200 rounded-xl mx-auto mt-6"></div>
                </div>

                {/* Features grid */}
                <div className="grid grid-cols-3 gap-4 pt-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3 text-center">
                      <div className="h-16 w-16 bg-slate-200 rounded-xl mx-auto"></div>
                      <div className="h-4 w-24 bg-slate-200 rounded mx-auto"></div>
                      <div className="h-3 w-32 bg-slate-100 rounded mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating construction elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 text-4xl animate-bounce" style={{ animationDelay: '0s' }}>🔧</div>
                <div className="absolute top-1/3 right-1/4 text-3xl animate-bounce" style={{ animationDelay: '0.5s' }}>⚡</div>
                <div className="absolute bottom-1/3 left-1/3 text-3xl animate-bounce" style={{ animationDelay: '1s' }}>✨</div>
              </div>
            </div>

            {/* Footer with FASTLANE branding */}
            <div className="bg-[#C3F53C] py-6 text-center">
              <div className="font-serif-display font-black italic text-4xl text-slate-900 tracking-tight">
                FASTLANE
              </div>
            </div>
          </div>
        </div>

        {/* Status info */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📋</span> What happens next?
          </h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lime-100 text-lime-600 flex items-center justify-center text-xs font-bold">1</span>
              <span>Our team reviews your content and references</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lime-100 text-lime-600 flex items-center justify-center text-xs font-bold">2</span>
              <span>We build a custom website tailored to your brand</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lime-100 text-lime-600 flex items-center justify-center text-xs font-bold">3</span>
              <span>You&apos;ll receive an email when your preview is ready</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lime-100 text-lime-600 flex items-center justify-center text-xs font-bold">4</span>
              <span>Review and request up to 2 rounds of revisions</span>
            </li>
          </ul>
        </div>

        {/* Estimated time */}
        <div className="mt-4 text-center text-sm text-slate-400">
          <p>Typical turnaround: 2-3 business days</p>
        </div>
      </div>
    )
  }

  // Default: Content phase
  return (
    <div className="max-w-2xl mx-auto">
      <PhaseProgress
        phases={phases}
        currentPhase={phase}
        completedPhases={completedPhases}
        onPrevious={goToPreviousPhase}
        onNext={completedPhases.includes('content') ? goToNextPhase : undefined}
      />
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

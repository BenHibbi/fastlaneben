'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

export default function IntakePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    location: '',
    goal: '',
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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      setError('Please sign in to continue')
      setLoading(false)
      return
    }

    // Check if client already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, state')
      .eq('email', user.email)
      .single()

    const intakeData = {
      goal: formData.goal,
      style: formData.style,
      description: formData.description,
      competitors: formData.competitors.split('\n').filter(Boolean)
    }

    if (existingClient) {
      // Update existing client
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

      // Log state transition
      const existingClientData = existingClient as { id: string; state: string }
      await supabase.from('state_transitions').insert({
        client_id: existingClientData.id,
        from_state: existingClientData.state,
        to_state: 'LOCKED',
        triggered_by: user.id,
        trigger_type: 'CLIENT',
        metadata: { action: 'intake_submitted' }
      } as never)
    } else {
      // Create new client
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          email: user.email,
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

      // Log initial state
      const newClientData = newClient as { id: string }
      await supabase.from('state_transitions').insert({
        client_id: newClientData.id,
        from_state: null,
        to_state: 'LOCKED',
        triggered_by: user.id,
        trigger_type: 'CLIENT',
        metadata: { action: 'intake_submitted' }
      } as never)
    }

    router.push('/client/locked')
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.business_name.trim() !== ''
      case 2:
        return formData.industry !== ''
      case 3:
        return formData.location.trim() !== ''
      case 4:
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
            What's your business called?
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
                onClick={() => updateField('industry', industry)}
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
            What's the main goal of your website?
          </h1>
          <p className="text-slate-500 mb-8">This shapes how we structure your site.</p>
          <div className="grid gap-3">
            {GOALS.map((goal) => (
              <button
                key={goal}
                onClick={() => updateField('goal', goal)}
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
        </div>
      )}

      {/* Step 5: Style */}
      {step === 5 && (
        <div className="animate-blur-fade">
          <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
            What style resonates with you?
          </h1>
          <p className="text-slate-500 mb-8">We'll use this as a starting point for your design.</p>
          <div className="grid gap-3">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => updateField('style', style)}
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

      {/* Step 6: Additional Info (Optional) */}
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

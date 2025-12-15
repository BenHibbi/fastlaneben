'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client, SupportRequest } from '@/types/database'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const REQUEST_TYPES = [
  { value: 'content_update', label: 'Content Update', description: 'Change text, images, or info' },
  { value: 'design_change', label: 'Design Tweak', description: 'Colors, fonts, layout changes' },
  { value: 'new_feature', label: 'New Feature', description: 'Add a new page or section' },
  { value: 'bug_report', label: 'Bug Report', description: 'Something isn\'t working right' },
  { value: 'question', label: 'General Question', description: 'Ask us anything' }
]

export default function SupportPage() {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    request_type: '',
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      router.push('/login')
      return
    }

    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .single()

    if (!clientData) {
      router.push('/client/intake')
      return
    }

    const typedClientData = clientData as unknown as Client

    // Allow access if LIVE or SUPPORT state
    if (typedClientData.state !== 'LIVE' && typedClientData.state !== 'SUPPORT') {
      router.push('/client')
      return
    }

    setClient(typedClientData)

    // Load support requests
    const { data: requestsData } = await supabase
      .from('support_requests')
      .select('*')
      .eq('client_id', typedClientData.id)
      .order('created_at', { ascending: false })

    setRequests((requestsData || []) as SupportRequest[])
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!client || !formData.request_type || !formData.description.trim()) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Create support request
    const { error: insertError } = await supabase
      .from('support_requests')
      .insert({
        client_id: client.id,
        request_type: formData.request_type,
        description: formData.description,
        attachments: [],
        status: 'pending'
      } as never)

    if (insertError) {
      setError('Failed to submit request. Please try again.')
      setSubmitting(false)
      return
    }

    // Transition to SUPPORT state if not already
    if (client.state === 'LIVE') {
      await supabase
        .from('clients')
        .update({
          state: 'SUPPORT',
          state_changed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as never)
        .eq('id', client.id)

      await supabase.from('state_transitions').insert({
        client_id: client.id,
        from_state: 'LIVE',
        to_state: 'SUPPORT',
        triggered_by: user?.id,
        trigger_type: 'CLIENT',
        metadata: { action: 'support_request_created' }
      } as never)
    }

    setFormData({ request_type: '', description: '' })
    setShowForm(false)
    setSuccess(true)
    setSubmitting(false)

    // Reload data
    loadData()

    // Clear success message after a few seconds
    setTimeout(() => setSuccess(false), 5000)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!client) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full mb-4">
          Support
        </span>

        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
          How can we help?
        </h1>

        <p className="text-slate-500 text-lg">
          Your subscription includes unlimited support. We're here for you.
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          ✓ Request submitted! We'll get back to you soon.
        </div>
      )}

      {/* New request button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-8 px-6 py-4 bg-[#C3F53C] text-slate-900 rounded-xl font-bold text-lg hover:bg-[#b4e62b] transition-colors"
        >
          + New Support Request
        </button>
      ) : (
        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <h2 className="font-medium text-slate-900 mb-4">New Request</h2>

          {/* Request type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              What type of request is this?
            </label>
            <div className="grid gap-2">
              {REQUEST_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFormData(prev => ({ ...prev, request_type: type.value }))}
                  className={`w-full p-3 text-left rounded-lg border transition-all ${
                    formData.request_type === type.value
                      ? 'border-lime-400 bg-lime-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900">{type.label}</p>
                  <p className="text-sm text-slate-500">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Describe your request
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Tell us what you need..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.request_type || !formData.description.trim() || submitting}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      )}

      {/* Previous requests */}
      <div>
        <h2 className="font-medium text-slate-900 mb-4">Your Requests</h2>

        {requests.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <p className="text-slate-400">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border border-slate-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {REQUEST_TYPES.find(t => t.value === request.request_type)?.label || request.request_type}
                    </span>
                    <p className="text-xs text-slate-400">
                      {new Date(request.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    request.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : request.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {request.status === 'pending' ? 'Pending' :
                     request.status === 'in_progress' ? 'In Progress' : 'Resolved'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2">{request.description}</p>
                {request.admin_notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Response:</p>
                    <p className="text-sm text-slate-700">{request.admin_notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      {client.live_url && (
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <a
            href={client.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Visit your site →
          </a>
        </div>
      )}
    </div>
  )
}

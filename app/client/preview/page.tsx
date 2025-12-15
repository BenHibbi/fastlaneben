'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types/database'

export default function PreviewPage() {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [showRevisionForm, setShowRevisionForm] = useState(false)
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

    if (clientData.state !== 'PREVIEW_READY') {
      router.push('/client')
      return
    }

    setClient(clientData)
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!client) return
    setActionLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Transition to ACTIVATION
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        state: 'ACTIVATION',
        state_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', client.id)

    if (updateError) {
      setError('Failed to approve. Please try again.')
      setActionLoading(false)
      return
    }

    // Log transition
    await supabase.from('state_transitions').insert({
      client_id: client.id,
      from_state: 'PREVIEW_READY',
      to_state: 'ACTIVATION',
      triggered_by: user?.id,
      trigger_type: 'CLIENT',
      metadata: { action: 'preview_approved' }
    } as never)

    router.push('/client/activate')
  }

  const handleRequestRevision = async () => {
    if (!client || !revisionNotes.trim()) return
    setActionLoading(true)
    setError('')

    if (client.revisions_remaining <= 0) {
      setError('No revisions remaining')
      setActionLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Transition back to LOCKED with revision request
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        state: 'LOCKED',
        state_changed_at: new Date().toISOString(),
        revision_requested: true,
        revision_notes: revisionNotes,
        revisions_remaining: client.revisions_remaining - 1,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', client.id)

    if (updateError) {
      setError('Failed to request revision. Please try again.')
      setActionLoading(false)
      return
    }

    // Log transition
    await supabase.from('state_transitions').insert({
      client_id: client.id,
      from_state: 'PREVIEW_READY',
      to_state: 'LOCKED',
      triggered_by: user?.id,
      trigger_type: 'CLIENT',
      metadata: { action: 'revision_requested', notes: revisionNotes }
    } as never)

    router.push('/client/locked')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) return null

  const screenshots = (client.preview_screenshots || []) as string[]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full mb-4">
          Preview Ready
        </span>

        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
          Here's your site preview
        </h1>

        <p className="text-slate-500 text-lg max-w-md mx-auto">
          Review the mockup below. You can approve it or request one revision.
        </p>
      </div>

      {/* Preview iframe or screenshots */}
      <div className="bg-slate-100 rounded-2xl overflow-hidden mb-8">
        {client.preview_url ? (
          <div className="aspect-[16/10]">
            <iframe
              src={client.preview_url}
              className="w-full h-full border-0"
              title="Site Preview"
            />
          </div>
        ) : screenshots.length > 0 ? (
          <div className="space-y-4 p-4">
            {screenshots.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Preview ${i + 1}`}
                className="w-full rounded-lg shadow-lg"
              />
            ))}
          </div>
        ) : (
          <div className="aspect-[16/10] flex items-center justify-center text-slate-400">
            <p>Preview not available yet. Please check back soon.</p>
          </div>
        )}
      </div>

      {/* Revision status */}
      <div className="text-center mb-8">
        <p className="text-sm text-slate-500">
          {client.revisions_remaining > 0 ? (
            <>
              <span className="font-medium text-slate-700">{client.revisions_remaining}</span> revision remaining
            </>
          ) : (
            <span className="text-amber-600">No revisions remaining</span>
          )}
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm text-center mb-4">{error}</p>
      )}

      {/* Revision form */}
      {showRevisionForm ? (
        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <h3 className="font-medium text-slate-900 mb-3">What would you like changed?</h3>
          <textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="Describe the changes you'd like us to make..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowRevisionForm(false)}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestRevision}
              disabled={!revisionNotes.trim() || actionLoading}
              className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {actionLoading ? 'Submitting...' : 'Submit Revision'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          {client.revisions_remaining > 0 && (
            <button
              onClick={() => setShowRevisionForm(true)}
              className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Request Revision
            </button>
          )}
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="flex-1 px-6 py-4 bg-[#C3F53C] text-slate-900 rounded-xl font-bold hover:bg-[#b4e62b] disabled:opacity-50 transition-colors"
          >
            {actionLoading ? 'Processing...' : 'Approve & Continue →'}
          </button>
        </div>
      )}
    </div>
  )
}

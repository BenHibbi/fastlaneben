'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { STATE_CONFIG } from '@/lib/state-machine'
import type { ClientState } from '@/types/database'

interface Props {
  clientId: string
  currentState: ClientState
  availableTransitions: ClientState[]
  revisionRequested: boolean
  revisionNotes: string | null
  previewUrl: string | null
  liveUrl: string | null
}

export default function AdminClientActions({
  clientId,
  currentState,
  availableTransitions,
  revisionRequested,
  revisionNotes,
  previewUrl,
  liveUrl,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [newPreviewUrl, setNewPreviewUrl] = useState(previewUrl || '')
  const [newLiveUrl, setNewLiveUrl] = useState(liveUrl || '')
  const [internalNotes, setInternalNotes] = useState('')

  const handleTransition = async (toState: ClientState) => {
    if (!confirm(`Transition client to ${STATE_CONFIG[toState].label}?`)) return

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('clients')
      .update({
        state: toState,
        state_changed_at: new Date().toISOString(),
        revision_requested: false, // Clear revision flag on any transition
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', clientId)

    await supabase.from('state_transitions').insert({
      client_id: clientId,
      from_state: currentState,
      to_state: toState,
      triggered_by: user?.id,
      trigger_type: 'ADMIN',
      metadata: { action: 'manual_transition' }
    } as never)

    setLoading(false)
    router.refresh()
  }

  const handleUpdateUrls = async () => {
    setLoading(true)
    const supabase = createClient()

    await supabase
      .from('clients')
      .update({
        preview_url: newPreviewUrl || null,
        live_url: newLiveUrl || null,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', clientId)

    setLoading(false)
    router.refresh()
  }

  const handleSaveNotes = async () => {
    setLoading(true)
    const supabase = createClient()

    await supabase
      .from('clients')
      .update({
        internal_notes: internalNotes,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', clientId)

    setLoading(false)
    alert('Notes saved!')
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="font-medium text-slate-900 mb-4">Admin Actions</h2>

      {/* Revision notice */}
      {revisionRequested && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="font-medium text-amber-800 mb-1">⚠️ Revision Requested</p>
          <p className="text-sm text-amber-700">{revisionNotes}</p>
        </div>
      )}

      {/* State transitions */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Move to State
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTransitions.map(state => (
            <button
              key={state}
              onClick={() => handleTransition(state)}
              disabled={loading}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              → {STATE_CONFIG[state].label}
            </button>
          ))}
          {availableTransitions.length === 0 && (
            <p className="text-sm text-slate-500">No transitions available for this state</p>
          )}
        </div>
      </div>

      {/* URL management */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Preview URL
          </label>
          <input
            type="url"
            value={newPreviewUrl}
            onChange={(e) => setNewPreviewUrl(e.target.value)}
            placeholder="https://preview.example.com/client-site"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-slate-400 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Live URL
          </label>
          <input
            type="url"
            value={newLiveUrl}
            onChange={(e) => setNewLiveUrl(e.target.value)}
            placeholder="https://clientbusiness.com"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-slate-400 outline-none text-sm"
          />
        </div>
        <button
          onClick={handleUpdateUrls}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Update URLs'}
        </button>
      </div>

      {/* Internal notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Internal Notes
        </label>
        <textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Private notes about this client..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-slate-400 outline-none text-sm resize-none"
        />
        <button
          onClick={handleSaveNotes}
          disabled={loading}
          className="mt-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Save Notes
        </button>
      </div>
    </div>
  )
}

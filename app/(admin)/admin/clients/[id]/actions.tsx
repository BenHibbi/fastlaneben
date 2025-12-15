'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { STATE_CONFIG } from '@/lib/state-machine'
import type { ClientState } from '@/types/database'
import { transitionClientState, updateClientUrls, saveClientNotes } from './server-actions'

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
  const [isPending, startTransition] = useTransition()
  const [newPreviewUrl, setNewPreviewUrl] = useState(previewUrl || '')
  const [newLiveUrl, setNewLiveUrl] = useState(liveUrl || '')
  const [internalNotes, setInternalNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleTransition = async (toState: ClientState) => {
    if (!confirm(`Transition client to ${STATE_CONFIG[toState].label}?`)) return

    setError(null)
    startTransition(async () => {
      try {
        await transitionClientState(clientId, currentState, toState)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to transition')
      }
    })
  }

  const handleUpdateUrls = async () => {
    setError(null)
    startTransition(async () => {
      try {
        await updateClientUrls(clientId, newPreviewUrl || null, newLiveUrl || null)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update URLs')
      }
    })
  }

  const handleSaveNotes = async () => {
    setError(null)
    startTransition(async () => {
      try {
        await saveClientNotes(clientId, internalNotes)
        alert('Notes saved!')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save notes')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="font-medium text-slate-900 mb-4">Admin Actions</h2>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

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
              disabled={isPending}
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
          disabled={isPending}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving...' : 'Update URLs'}
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
          disabled={isPending}
          className="mt-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Save Notes
        </button>
      </div>
    </div>
  )
}

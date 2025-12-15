'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ClientState } from '@/types/database'
import { updateClientUrls, saveClientNotes, updatePreviewScreenshots, uploadMockup } from './server-actions'

interface Props {
  clientId: string
  currentState: ClientState
  revisionRequested: boolean
  revisionNotes: string | null
  previewUrl: string | null
  liveUrl: string | null
  previewScreenshots: string[]
}

export default function AdminClientActions({
  clientId,
  currentState,
  revisionRequested,
  revisionNotes,
  previewUrl,
  liveUrl,
  previewScreenshots,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newPreviewUrl, setNewPreviewUrl] = useState(previewUrl || '')
  const [newLiveUrl, setNewLiveUrl] = useState(liveUrl || '')
  const [internalNotes, setInternalNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [screenshots, setScreenshots] = useState<string[]>(previewScreenshots)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpdateUrls = async () => {
    setError(null)
    startTransition(async () => {
      try {
        const result = await updateClientUrls(clientId, newPreviewUrl || null, newLiveUrl || null, currentState)
        if (result.transitioned) {
          alert('Client is now LIVE!')
        }
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

  const handleUploadMockup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const newUrls: string[] = []

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const { url } = await uploadMockup(clientId, formData)
        newUrls.push(url)
      }

      const updatedScreenshots = [...screenshots, ...newUrls]
      const result = await updatePreviewScreenshots(clientId, updatedScreenshots, currentState)
      setScreenshots(updatedScreenshots)

      if (result.transitioned) {
        alert('Client transitioned to PREVIEW_READY!')
      }

      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload mockup')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteMockup = async (urlToDelete: string) => {
    if (!confirm('Supprimer ce mockup ?')) return

    setError(null)
    startTransition(async () => {
      try {
        const updatedScreenshots = screenshots.filter(url => url !== urlToDelete)
        await updatePreviewScreenshots(clientId, updatedScreenshots, currentState)
        setScreenshots(updatedScreenshots)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete mockup')
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
          <p className="font-medium text-amber-800 mb-1">Revision Requested</p>
          <p className="text-sm text-amber-700">{revisionNotes}</p>
        </div>
      )}

      {/* 1. Mockup Upload - First step */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          1. Preview Mockups
          {currentState === 'LOCKED' && (
            <span className="ml-2 text-xs text-amber-600 font-normal">
              (Upload to transition to Preview Ready)
            </span>
          )}
        </label>

        {/* Current mockups */}
        {screenshots.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {screenshots.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Mockup ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-slate-200"
                />
                <button
                  onClick={() => handleDeleteMockup(url)}
                  disabled={isPending}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUploadMockup}
            className="hidden"
            id="mockup-upload"
          />
          <label
            htmlFor="mockup-upload"
            className={`px-4 py-2 border border-dashed border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? 'Uploading...' : '+ Upload Mockup'}
          </label>
          {screenshots.length === 0 && (
            <span className="text-sm text-slate-400">Aucun mockup</span>
          )}
        </div>
      </div>

      {/* 2. Preview URL */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          2. Preview URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newPreviewUrl}
            onChange={(e) => setNewPreviewUrl(e.target.value)}
            placeholder="https://preview.example.com/client-site"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:border-slate-400 outline-none text-sm"
          />
        </div>
      </div>

      {/* 3. Live URL */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          3. Live URL
          {currentState === 'FINAL_ONBOARDING' && (
            <span className="ml-2 text-xs text-green-600 font-normal">
              (Set to transition to Live)
            </span>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newLiveUrl}
            onChange={(e) => setNewLiveUrl(e.target.value)}
            placeholder="https://clientbusiness.com"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:border-slate-400 outline-none text-sm"
          />
        </div>
      </div>

      {/* Save URLs button */}
      <button
        onClick={handleUpdateUrls}
        disabled={isPending}
        className="w-full mb-6 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Saving...' : 'Save URLs'}
      </button>

      {/* Internal notes */}
      <div className="pt-4 border-t border-slate-100">
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

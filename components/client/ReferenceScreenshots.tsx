'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Client, ReferenceScreenshot } from '@/types/database'

interface ReferenceScreenshotsProps {
  client: Client
  onComplete: () => void
  onUpdate: () => void
}

const MAX_SCREENSHOTS = 10

export function ReferenceScreenshots({
  client,
  onComplete,
  onUpdate
}: ReferenceScreenshotsProps) {
  const [screenshots, setScreenshots] = useState<ReferenceScreenshot[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remainingSlots = MAX_SCREENSHOTS - screenshots.length
    if (remainingSlots <= 0) {
      setError(`Maximum ${MAX_SCREENSHOTS} screenshots allowed`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    setUploading(true)
    setError('')

    const supabase = createClient()
    const newScreenshots: ReferenceScreenshot[] = []

    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop()
      const path = `${client.id}/reference-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(path, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      // Use signed URL (1 year) since bucket may not be public
      let imageUrl: string
      const { data: signedUrlData } = await supabase.storage
        .from('client-files')
        .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 year

      if (signedUrlData?.signedUrl) {
        imageUrl = signedUrlData.signedUrl
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('client-files')
          .getPublicUrl(path)
        imageUrl = publicUrl
      }

      // Save to reference_screenshots table
      const { data: screenshot, error: insertError } = await supabase
        .from('reference_screenshots')
        .insert({
          client_id: client.id,
          url: imageUrl
        } as never)
        .select()
        .single()

      if (!insertError && screenshot) {
        newScreenshots.push(screenshot as ReferenceScreenshot)
      }
    }

    setScreenshots((prev) => [...prev, ...newScreenshots])
    setUploading(false)
    onUpdate()

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeScreenshot = async (id: string) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('reference_screenshots')
      .delete()
      .eq('id', id)

    if (!error) {
      setScreenshots((prev) => prev.filter((s) => s.id !== id))
      onUpdate()
    }
  }

  const handleContinue = async () => {
    // Update client status to show references complete
    const supabase = createClient()
    await supabase
      .from('clients')
      .update({
        creative_brief_status: 'complete',
        onboarding_phase: 'content',
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', client.id)

    onUpdate()
    onComplete()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif-display text-slate-900 mb-2">
          Share your inspiration
        </h2>
        <p className="text-slate-500">
          Upload screenshots of websites you love. This helps us understand your style preferences.
        </p>
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          uploading
            ? 'border-slate-200 bg-slate-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
            <p className="mt-2 text-sm text-slate-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-10 h-10 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PNG, JPG up to 10MB • {MAX_SCREENSHOTS - screenshots.length} slots remaining
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Screenshots grid */}
      {screenshots.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-700">
              Uploaded References ({screenshots.length})
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {screenshots.map((screenshot) => (
              <div
                key={screenshot.id}
                className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden group"
              >
                <img
                  src={screenshot.url}
                  alt="Reference"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeScreenshot(screenshot.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {screenshots.length === 0 && (
        <div className="mt-6 p-6 bg-slate-50 rounded-xl text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            No references uploaded yet. This step is optional but helps us understand your style.
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl">
        <h4 className="font-medium text-blue-900 mb-2">What to share:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Homepage designs you find appealing</li>
          <li>• Color schemes that match your brand</li>
          <li>• Navigation styles you like</li>
          <li>• Any specific sections or features</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={handleContinue}
          className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          {screenshots.length > 0 ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Continue with {screenshots.length} reference{screenshots.length !== 1 ? 's' : ''}
            </>
          ) : (
            'Skip for now'
          )}
        </button>
      </div>
    </div>
  )
}

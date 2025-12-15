'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types/database'

export default function FinalPage() {
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    tagline: '',
    about: '',
    services: '',
    contact_email: '',
    contact_phone: '',
    social_links: ''
  })

  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

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

    if (clientData.state !== 'FINAL_ONBOARDING') {
      router.push('/client')
      return
    }

    // Pre-fill if they have previous final content
    if (clientData.final_content && typeof clientData.final_content === 'object') {
      const content = clientData.final_content as Record<string, string>
      setFormData({
        tagline: content.tagline || '',
        about: content.about || '',
        services: content.services || '',
        contact_email: content.contact_email || '',
        contact_phone: content.contact_phone || '',
        social_links: content.social_links || ''
      })
    }

    if (clientData.final_images && Array.isArray(clientData.final_images)) {
      setUploadedImages(clientData.final_images as string[])
    }

    setClient(clientData)
    setLoading(false)
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !client) return

    setUploading(true)
    setError('')

    const supabase = createClient()
    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${client.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(path, file)

      if (uploadError) {
        setError(`Failed to upload ${file.name}`)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('client-files')
        .getPublicUrl(path)

      newUrls.push(publicUrl)
    }

    setUploadedImages(prev => [...prev, ...newUrls])
    setUploading(false)

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!client) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()

    const { error: updateError } = await supabase
      .from('clients')
      .update({
        final_content: formData,
        final_images: uploadedImages,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', client.id)

    if (updateError) {
      setError('Failed to save. Please try again.')
      setSubmitting(false)
      return
    }

    // Notify admin that final content is ready (could trigger email)
    await supabase.from('state_transitions').insert({
      client_id: client.id,
      from_state: 'FINAL_ONBOARDING',
      to_state: 'FINAL_ONBOARDING',
      trigger_type: 'CLIENT',
      metadata: { action: 'final_content_submitted' }
    } as never)

    setSubmitting(false)
    // Show success state - stay on page
    alert('Content saved! We\'ll notify you when your site is live.')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!client) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-700 text-sm font-medium rounded-full mb-4">
          Final Details
        </span>

        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
          Let's finalize your content
        </h1>

        <p className="text-slate-500 text-lg">
          Add the text and images you want on your site.
        </p>
      </div>

      <div className="space-y-6">
        {/* Tagline */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Tagline / Headline
          </label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
            placeholder="e.g., Quality work you can trust"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all"
          />
        </div>

        {/* About */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            About your business
          </label>
          <textarea
            value={formData.about}
            onChange={(e) => updateField('about', e.target.value)}
            placeholder="Tell visitors about who you are and what you do..."
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none"
          />
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Services / Products
          </label>
          <textarea
            value={formData.services}
            onChange={(e) => updateField('services', e.target.value)}
            placeholder="List your main services or products..."
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-lime-400 focus:ring-2 focus:ring-lime-100 outline-none transition-all resize-none"
          />
        </div>

        {/* Contact info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contact Email
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
            Images for your site
          </label>
          <p className="text-sm text-slate-500 mb-3">
            Logo, photos of your work, team, or storefront.
          </p>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-300 transition-colors">
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
              <div className="text-4xl mb-2">📷</div>
              <p className="text-slate-600 font-medium">
                {uploading ? 'Uploading...' : 'Click to upload images'}
              </p>
              <p className="text-sm text-slate-400 mt-1">PNG, JPG up to 10MB each</p>
            </label>
          </div>

          {/* Uploaded images preview */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {uploadedImages.map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={url}
                    alt={`Upload ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
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

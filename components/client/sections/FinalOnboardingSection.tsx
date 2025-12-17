'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client, OnboardingPhase } from '@/types/database'
import {
  VoiceBriefRecorder,
  ReferenceScreenshots,
  ReactPreviewRenderer,
  RevisionRequestForm
} from '@/components/client'
import { PhaseProgress } from './PhaseProgress'

const MAX_PHOTOS = 6

interface FinalOnboardingSectionProps {
  client: Client
  onUpdate: () => void
}

export function FinalOnboardingSection({ client, onUpdate }: FinalOnboardingSectionProps) {
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

  const canSubmit = () => {
    const requiredFields = ['tagline', 'about', 'detailed_description', 'services', 'contact_email']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]?.trim())
    const emailValid = isValidEmail(formData.contact_email)
    return missingFields.length === 0 && uploadedImages.length > 0 && emailValid
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

  // Handler for when revisions are submitted
  const handleRevisionSubmitted = async () => {
    setShowRevisionForm(false)
    setPhase('building')

    // Persist to database
    const supabase = createClient()
    await supabase
      .from('clients')
      .update({
        onboarding_phase: 'building',
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', client.id)

    onUpdate()
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
    const isRevisionRound = (client.revision_round || 1) > 1 || (client.revision_modifications_used || 0) > 0
    const roundNumber = client.revision_round || 1

    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-100 text-lime-700 rounded-full text-sm font-medium mb-6">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500"></span>
            </span>
            {isRevisionRound ? `Building V${roundNumber + 1}` : 'Building in progress'}
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
            {isRevisionRound
              ? `We're building your updated preview!`
              : `We're building your site!`}
          </h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            {isRevisionRound
              ? `We've received your revision requests and are working on V${roundNumber + 1} for ${client.business_name || 'your business'}. We'll notify you when it's ready!`
              : `Our team is crafting something beautiful for ${client.business_name || 'your business'}. We'll notify you when it's ready to review.`}
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

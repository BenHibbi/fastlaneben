import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminUser } from '@/lib/auth/admin'
import { STATE_CONFIG } from '@/lib/state-machine'
import type { Client, ClientState } from '@/types/database'

export default async function AdminPreviewPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params

  // Verify admin
  const adminUser = await getAdminUser()
  if (!adminUser) {
    redirect('/login?next=/admin')
  }

  const supabase = createAdminClient()

  // Get client data
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error || !data) {
    notFound()
  }

  const client = data as Client
  const state = client.state as ClientState
  const intakeData = client.intake_data as Record<string, unknown> | null
  const screenshots = (client.preview_screenshots || []) as string[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-lime-50/30 to-white">
      {/* Admin Preview Banner */}
      <div className="bg-slate-900 text-white px-4 py-2 text-center text-sm">
        <span className="font-medium">Admin Preview</span>
        <span className="mx-2">|</span>
        <span>{client.business_name || client.email}</span>
        <span className="mx-2">|</span>
        <span className="px-2 py-0.5 bg-white/20 rounded text-xs">{STATE_CONFIG[state].label}</span>
        <Link href={`/admin/clients/${clientId}`} className="ml-4 underline hover:no-underline">
          Back to Admin
        </Link>
      </div>

      {/* Client View */}
      <div className="px-4 py-12">
        {/* INTAKE state */}
        {state === 'INTAKE' && (
          <div className="max-w-xl mx-auto text-center">
            <h1 className="font-serif text-3xl text-slate-900 mb-4">Intake Form</h1>
            <p className="text-slate-500">Client has not completed the intake form yet.</p>
          </div>
        )}

        {/* LOCKED state */}
        {state === 'LOCKED' && (
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl text-slate-900 mb-4">Your preview is being built</h1>
            <p className="text-slate-500 text-lg mb-8">
              We are crafting something beautiful for {client.business_name}. You will get notified when it is ready to review.
            </p>

            {/* Summary card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">
              <h2 className="font-medium text-slate-900 mb-4">Your submission</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Business</dt>
                  <dd className="font-medium text-slate-900">{client.business_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Industry</dt>
                  <dd className="font-medium text-slate-900">{client.industry}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="font-medium text-slate-900">{client.location}</dd>
                </div>
                {typeof intakeData?.goal === 'string' && intakeData.goal && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Goal</dt>
                    <dd className="font-medium text-slate-900">{intakeData.goal}</dd>
                  </div>
                )}
                {typeof intakeData?.style === 'string' && intakeData.style && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Style</dt>
                    <dd className="font-medium text-slate-900">{intakeData.style}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* PREVIEW_READY state */}
        {state === 'PREVIEW_READY' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="font-serif text-3xl text-slate-900 mb-4">Your preview is ready!</h1>
              <p className="text-slate-500 text-lg">
                Review your website mockup below. When you are happy, approve it to proceed to activation.
              </p>
            </div>

            {/* Mockup Gallery */}
            {screenshots.length > 0 ? (
              <div className="space-y-6 mb-8">
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
            ) : (
              <div className="bg-slate-100 rounded-2xl p-12 text-center mb-8">
                <p className="text-slate-500">No mockups uploaded yet</p>
              </div>
            )}

            {/* Action Buttons (disabled in preview) */}
            <div className="flex gap-4">
              <button
                disabled
                className="flex-1 py-3 px-4 bg-slate-200 text-slate-500 rounded-xl font-medium cursor-not-allowed"
              >
                Request Changes (disabled in preview)
              </button>
              <button
                disabled
                className="flex-1 py-3 px-4 bg-slate-200 text-slate-500 rounded-xl font-medium cursor-not-allowed"
              >
                Approve & Activate (disabled in preview)
              </button>
            </div>
          </div>
        )}

        {/* ACTIVATION state */}
        {state === 'ACTIVATION' && (
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">&#127881;</span>
            </div>
            <h1 className="font-serif text-3xl text-slate-900 mb-4">Let&apos;s make it official</h1>
            <p className="text-slate-500 text-lg mb-8">
              You are one step away from having your site live.
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-medium text-slate-900 mb-2">Fastlane Website</h2>
              <p className="text-slate-500 text-sm mb-4">$299/month subscription</p>
              <button
                disabled
                className="w-full py-3 px-4 bg-slate-200 text-slate-500 rounded-xl font-medium cursor-not-allowed"
              >
                Checkout (disabled in preview)
              </button>
            </div>
          </div>
        )}

        {/* FINAL_ONBOARDING state */}
        {state === 'FINAL_ONBOARDING' && (
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-serif text-3xl text-slate-900 mb-4">Let&apos;s finalize your content</h1>
            <p className="text-slate-500 text-lg mb-8">
              Add the text and images you want on your site.
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left">
              <p className="text-slate-500 text-sm">
                Client is currently filling out their final content (tagline, about, services, contact info, images).
              </p>
            </div>
          </div>
        )}

        {/* LIVE state */}
        {state === 'LIVE' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl text-slate-900 mb-4">Your site is live!</h1>
            <p className="text-slate-500 text-lg mb-8">
              Congratulations! Your Fastlane website is now online.
            </p>
            {client.live_url && (
              <a
                href={client.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-lime-400 text-slate-900 rounded-xl font-medium hover:bg-lime-300 transition-colors"
              >
                Visit Your Site
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

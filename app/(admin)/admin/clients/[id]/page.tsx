import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth/admin'
import { STATE_CONFIG } from '@/lib/state-machine'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Client, StateTransition, VoiceBrief, ReferenceScreenshot, ReactPreview, RevisionRequest } from '@/types/database'
import AdminClientActions from './actions'
import CreativeBriefSection from './creative-brief'
import RevisionRequestsSection from './revision-requests'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Verify admin access
  const adminUser = await getAdminUser()
  if (!adminUser) {
    redirect('/login?next=/admin')
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Get client
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const client = data as Client

  // Get state history
  const { data: transitions } = await supabase
    .from('state_transitions')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const stateHistory = (transitions || []) as StateTransition[]

  // Get support requests
  const { data: supportRequests } = await supabase
    .from('support_requests')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  // Get voice brief
  const { data: voiceBriefData } = await supabase
    .from('voice_briefs')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const voiceBrief = voiceBriefData as VoiceBrief | null

  // Get reference screenshots
  const { data: referencesData } = await supabase
    .from('reference_screenshots')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const referenceScreenshots = (referencesData || []) as ReferenceScreenshot[]

  // Get active React preview
  const { data: previewData } = await supabase
    .from('react_previews')
    .select('*')
    .eq('client_id', id)
    .eq('is_active', true)
    .single()

  const reactPreview = previewData as ReactPreview | null

  // Get revision requests
  const { data: revisionsData } = await supabase
    .from('revision_requests')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  const revisionRequests = (revisionsData || []) as RevisionRequest[]

  // Parse intake data
  const intakeData = client.intake_data as Record<string, unknown> | null
  const finalContent = client.final_content as Record<string, string> | null
  const finalImages = (client.final_images || []) as string[]

  // Check if client is in final onboarding phase or later
  const showFinalContent = ['FINAL_ONBOARDING', 'LIVE'].includes(client.state)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/clients" className="text-sm text-slate-500 hover:text-slate-700 mb-2 block">
            ← Back to Clients
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{client.business_name || 'Unnamed Client'}</h1>
          <p className="text-slate-500">{client.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/preview/${client.id}`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview as Client
          </Link>
          <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
            client.state === 'LIVE' ? 'bg-green-100 text-green-700' :
            client.state === 'LOCKED' ? 'bg-amber-100 text-amber-700' :
            client.state === 'PREVIEW_READY' ? 'bg-purple-100 text-purple-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {STATE_CONFIG[client.state].label}
          </span>
          {client.subscription_status && (
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
              client.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
              client.subscription_status === 'past_due' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {client.subscription_status}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Admin Actions */}
          <AdminClientActions
            clientId={client.id}
            currentState={client.state}
            revisionRequested={client.revision_requested}
            revisionNotes={client.revision_notes}
            previewUrl={client.preview_url}
            liveUrl={client.live_url}
            previewScreenshots={(client.preview_screenshots || []) as string[]}
            currentReactPreview={reactPreview}
          />

          {/* Creative Brief Section */}
          {showFinalContent && (
            <CreativeBriefSection
              voiceBrief={voiceBrief}
              referenceScreenshots={referenceScreenshots}
            />
          )}

          {/* Revision Requests Section */}
          {revisionRequests.length > 0 && (
            <RevisionRequestsSection
              revisionRequests={revisionRequests}
              clientId={client.id}
            />
          )}

          {/* Intake Data */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-medium text-slate-900 mb-4">Intake Information</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Business Name</dt>
                <dd className="font-medium text-slate-900">{client.business_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Industry</dt>
                <dd className="font-medium text-slate-900">
                  {client.industry || '—'}
                  {client.industry === 'Other' && typeof intakeData?.industry_other === 'string' && (
                    <span className="text-slate-600"> — {intakeData.industry_other}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Location</dt>
                <dd className="font-medium text-slate-900">{client.location || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Goal</dt>
                <dd className="font-medium text-slate-900">
                  {(intakeData?.goal as string) || '—'}
                  {intakeData?.goal === 'Other' && typeof intakeData?.goal_other === 'string' && (
                    <span className="text-slate-600"> — {intakeData.goal_other}</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Style</dt>
                <dd className="font-medium text-slate-900">{intakeData?.style as string || '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500 mb-1">Description</dt>
                <dd className="text-slate-700">{intakeData?.description as string || '—'}</dd>
              </div>
              {Array.isArray(intakeData?.competitors) && intakeData.competitors.length > 0 && (
                <div className="col-span-2">
                  <dt className="text-slate-500 mb-1">Reference Sites</dt>
                  <dd className="text-slate-700">
                    {(intakeData.competitors as string[]).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                        {url}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Final Content - shown for FINAL_ONBOARDING and LIVE states */}
          {showFinalContent && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-slate-900">Client Content</h2>
                {(!finalContent || Object.keys(finalContent).length === 0) && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    Waiting for client to submit
                  </span>
                )}
              </div>

              {finalContent && Object.keys(finalContent).length > 0 ? (
                <dl className="space-y-4 text-sm">
                  {/* Tagline */}
                  <div>
                    <dt className="text-slate-500">Tagline / Headline</dt>
                    <dd className="font-medium text-slate-900">{finalContent.tagline || '—'}</dd>
                  </div>

                  {/* About */}
                  <div>
                    <dt className="text-slate-500 mb-1">About</dt>
                    <dd className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{finalContent.about || '—'}</dd>
                  </div>

                  {/* Detailed description (internal) */}
                  {finalContent.detailed_description && (
                    <div>
                      <dt className="text-slate-500 mb-1">
                        Detailed Description
                        <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Internal</span>
                      </dt>
                      <dd className="text-slate-700 whitespace-pre-wrap bg-purple-50 p-3 rounded-lg border border-purple-100">{finalContent.detailed_description}</dd>
                    </div>
                  )}

                  {/* Services */}
                  <div>
                    <dt className="text-slate-500 mb-1">Services / Products</dt>
                    <dd className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{finalContent.services || '—'}</dd>
                  </div>

                  {/* Call to Action */}
                  {finalContent.call_to_action && (
                    <div>
                      <dt className="text-slate-500">Call to Action</dt>
                      <dd className="font-medium text-slate-900">{finalContent.call_to_action}</dd>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <dt className="text-slate-500">Contact Email</dt>
                      <dd className="font-medium text-slate-900">{finalContent.contact_email || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Phone Number</dt>
                      <dd className="font-medium text-slate-900">{finalContent.contact_phone || '—'}</dd>
                    </div>
                  </div>

                  {/* Address */}
                  {finalContent.address && (
                    <div>
                      <dt className="text-slate-500">Business Address</dt>
                      <dd className="font-medium text-slate-900">{finalContent.address}</dd>
                    </div>
                  )}

                  {/* Social Links */}
                  {finalContent.social_links && (
                    <div>
                      <dt className="text-slate-500 mb-1">Social Media Links</dt>
                      <dd className="text-slate-700 font-mono text-xs whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{finalContent.social_links}</dd>
                    </div>
                  )}

                  {/* Photos */}
                  <div className="pt-2 border-t border-slate-100">
                    <dt className="text-slate-500 mb-2">Photos ({finalImages.length}/6)</dt>
                    {finalImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {finalImages.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                            <img
                              src={url}
                              alt={`Photo ${i + 1}`}
                              className="w-full aspect-square object-cover rounded-lg border border-slate-200 hover:border-slate-400 transition-colors"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <dd className="text-slate-400 italic">No photos uploaded yet</dd>
                    )}
                  </div>
                </dl>
              ) : (
                <p className="text-slate-500 text-sm">Client has not submitted their content yet.</p>
              )}
            </div>
          )}

          {/* Support Requests */}
          {supportRequests && supportRequests.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="font-medium text-slate-900 mb-4">Support Requests</h2>
              <div className="space-y-3">
                {supportRequests.map((request: Record<string, unknown>) => (
                  <div key={request.id as string} className="border border-slate-100 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-slate-900 capitalize">
                        {(request.request_type as string).replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {request.status as string}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{request.description as string}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(request.created_at as string).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-medium text-slate-900 mb-4">Details</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">Created</dt>
                <dd className="text-slate-900">{new Date(client.created_at).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Last Updated</dt>
                <dd className="text-slate-900">{new Date(client.updated_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-slate-500">State Changed</dt>
                <dd className="text-slate-900">{new Date(client.state_changed_at).toLocaleString()}</dd>
              </div>
              {client.stripe_customer_id && (
                <div>
                  <dt className="text-slate-500">Stripe Customer</dt>
                  <dd>
                    <a
                      href={`https://dashboard.stripe.com/customers/${client.stripe_customer_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View in Stripe →
                    </a>
                  </dd>
                </div>
              )}
              {client.terms_accepted_at && (
                <div>
                  <dt className="text-slate-500">Terms Accepted</dt>
                  <dd className="text-slate-900">{new Date(client.terms_accepted_at).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* URLs */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-medium text-slate-900 mb-4">URLs</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-500 mb-1">Preview URL</dt>
                <dd>
                  {client.preview_url ? (
                    <a href={client.preview_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {client.preview_url}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Live URL</dt>
                <dd>
                  {client.live_url ? (
                    <a href={client.live_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {client.live_url}
                    </a>
                  ) : (
                    <span className="text-slate-400">Not set</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* State History */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-medium text-slate-900 mb-4">State History</h2>
            <div className="space-y-3">
              {stateHistory.map((transition) => (
                <div key={transition.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{transition.from_state || 'New'}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-medium text-slate-900">{transition.to_state}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {transition.trigger_type} • {new Date(transition.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

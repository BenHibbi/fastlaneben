'use client'

import { useState, useEffect } from 'react'
import {
  ExternalLink,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import type { Client, RevisionRequest } from '@/types/database'
import { SupportChat } from '../SupportChat'
import { MODIFICATION_TYPES } from '@/types/database'

interface LiveSectionProps {
  client: Client
}

export function LiveSection({ client }: LiveSectionProps) {
  const [revisions, setRevisions] = useState<RevisionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchRevisions()
  }, [client.id])

  const fetchRevisions = async () => {
    try {
      const res = await fetch(`/api/revisions?clientId=${client.id}`)
      const data = await res.json()
      if (data.revisions) {
        setRevisions(data.revisions)
      }
    } catch (error) {
      console.error('Failed to fetch revisions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getModificationLabel = (type: string) => {
    const found = MODIFICATION_TYPES.find(m => m.value === type)
    return found?.label || type
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-amber-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'rejected':
        return 'Rejected'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'Pending'
    }
  }

  // Group revisions by round
  const round1Revisions = revisions.filter(r => r.round_number === 1)
  const round2Revisions = revisions.filter(r => r.round_number === 2)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎉</span>
        </div>

        <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
          Your site is live!
        </h1>

        <p className="text-slate-500 text-lg">
          Welcome to your Fastlane dashboard. Need help? Chat with our support agent below.
        </p>
      </div>

      {/* Main layout: 2 columns on desktop */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left column: Site info + history */}
        <div className="space-y-6">
          {/* Site URL card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="font-medium text-slate-900 mb-3">Your website</h2>
            {client.live_url ? (
              <a
                href={client.live_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-lg break-all"
              >
                {client.live_url}
                <ExternalLink className="w-5 h-5 flex-shrink-0" />
              </a>
            ) : (
              <p className="text-slate-500">URL will be available soon</p>
            )}

            {/* Subscription status */}
            {client.subscription_status && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">Subscription</span>
                <span className={`text-sm font-medium ${
                  client.subscription_status === 'active' ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {client.subscription_status === 'active' ? 'Active' : client.subscription_status}
                </span>
              </div>
            )}
          </div>

          {/* Revision History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-900">Revision History</span>
                <span className="text-sm text-slate-400">
                  ({revisions.length} request{revisions.length !== 1 ? 's' : ''})
                </span>
              </div>
              {showHistory ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {showHistory && (
              <div className="px-6 pb-6 space-y-6">
                {loading ? (
                  <p className="text-slate-500 text-sm">Loading...</p>
                ) : revisions.length === 0 ? (
                  <p className="text-slate-500 text-sm">No revision requests made.</p>
                ) : (
                  <>
                    {/* Round 1 */}
                    {round1Revisions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs">1</span>
                          Round 1
                        </h3>
                        <div className="space-y-2">
                          {round1Revisions.map(rev => (
                            <div key={rev.id} className="bg-slate-50 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 mb-1">
                                    {getModificationLabel(rev.modification_type)}
                                  </p>
                                  <p className="text-sm text-slate-700 break-words">
                                    {rev.description}
                                  </p>
                                  {rev.admin_response && (
                                    <p className="text-xs text-slate-500 mt-2 italic">
                                      Response: {rev.admin_response}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {getStatusIcon(rev.status)}
                                  <span className="text-xs text-slate-500">
                                    {getStatusLabel(rev.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Round 2 */}
                    {round2Revisions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-xs">2</span>
                          Round 2
                        </h3>
                        <div className="space-y-2">
                          {round2Revisions.map(rev => (
                            <div key={rev.id} className="bg-slate-50 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-slate-500 mb-1">
                                    {getModificationLabel(rev.modification_type)}
                                  </p>
                                  <p className="text-sm text-slate-700 break-words">
                                    {rev.description}
                                  </p>
                                  {rev.admin_response && (
                                    <p className="text-xs text-slate-500 mt-2 italic">
                                      Response: {rev.admin_response}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {getStatusIcon(rev.status)}
                                  <span className="text-xs text-slate-500">
                                    {getStatusLabel(rev.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Legal links */}
          <div className="bg-slate-50 rounded-2xl p-6">
            <h2 className="font-medium text-slate-900 mb-4">Legal Information</h2>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Terms of Service
              </a>
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Privacy Policy
              </a>
              <a
                href="/acceptable-use"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Acceptable Use
              </a>
              <a
                href="/faq"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <FileText className="w-4 h-4" />
                FAQ
              </a>
            </div>
          </div>
        </div>

        {/* Right column: Support chat (permanent) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SupportChat
            clientId={client.id}
            businessName={client.business_name || 'your business'}
          />
        </div>
      </div>
    </div>
  )
}

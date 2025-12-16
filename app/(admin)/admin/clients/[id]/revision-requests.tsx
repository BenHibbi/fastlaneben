'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { RevisionRequest, RevisionStatus } from '@/types/database'
import { MODIFICATION_TYPES } from '@/types/database'

interface RevisionRequestsSectionProps {
  revisionRequests: RevisionRequest[]
  clientId: string
}

export default function RevisionRequestsSection({
  revisionRequests,
  clientId
}: RevisionRequestsSectionProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [adminResponses, setAdminResponses] = useState<Record<string, string>>({})

  const handleUpdateStatus = async (revisionId: string, status: RevisionStatus, adminResponse?: string) => {
    setUpdating(revisionId)
    try {
      const res = await fetch('/api/revisions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionId,
          status,
          adminResponse
        })
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update revision:', error)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusIcon = (status: RevisionStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: RevisionStatus) => {
    const styles: Record<RevisionStatus, string> = {
      pending: 'bg-amber-100 text-amber-700',
      in_progress: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  const getModificationLabel = (type: string) => {
    const found = MODIFICATION_TYPES.find(m => m.value === type)
    return found ? found.label : type
  }

  // Group by round
  const round1 = revisionRequests.filter(r => r.round_number === 1)
  const round2 = revisionRequests.filter(r => r.round_number === 2)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-slate-600" />
        <h2 className="font-medium text-slate-900">Revision Requests</h2>
        <span className="text-xs text-slate-500">
          ({revisionRequests.length} total)
        </span>
      </div>

      {/* Round 1 */}
      {round1.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Round 1 ({round1.length}/10 modifications)</h3>
          <div className="space-y-3">
            {round1.map((revision) => (
              <RevisionCard
                key={revision.id}
                revision={revision}
                updating={updating === revision.id}
                adminResponse={adminResponses[revision.id] || ''}
                onAdminResponseChange={(value) => setAdminResponses(prev => ({ ...prev, [revision.id]: value }))}
                onUpdateStatus={handleUpdateStatus}
                getStatusIcon={getStatusIcon}
                getStatusBadge={getStatusBadge}
                getModificationLabel={getModificationLabel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Round 2 */}
      {round2.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-600 mb-3">Round 2 ({round2.length}/10 modifications)</h3>
          <div className="space-y-3">
            {round2.map((revision) => (
              <RevisionCard
                key={revision.id}
                revision={revision}
                updating={updating === revision.id}
                adminResponse={adminResponses[revision.id] || ''}
                onAdminResponseChange={(value) => setAdminResponses(prev => ({ ...prev, [revision.id]: value }))}
                onUpdateStatus={handleUpdateStatus}
                getStatusIcon={getStatusIcon}
                getStatusBadge={getStatusBadge}
                getModificationLabel={getModificationLabel}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface RevisionCardProps {
  revision: RevisionRequest
  updating: boolean
  adminResponse: string
  onAdminResponseChange: (value: string) => void
  onUpdateStatus: (id: string, status: RevisionStatus, response?: string) => void
  getStatusIcon: (status: RevisionStatus) => React.ReactNode
  getStatusBadge: (status: RevisionStatus) => React.ReactNode
  getModificationLabel: (type: string) => string
}

function RevisionCard({
  revision,
  updating,
  adminResponse,
  onAdminResponseChange,
  onUpdateStatus,
  getStatusIcon,
  getStatusBadge,
  getModificationLabel
}: RevisionCardProps) {
  const [showResponse, setShowResponse] = useState(false)

  return (
    <div className="border border-slate-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(revision.status)}
          <span className="font-medium text-slate-900">
            {getModificationLabel(revision.modification_type)}
          </span>
        </div>
        {getStatusBadge(revision.status)}
      </div>

      <p className="text-sm text-slate-600 mb-3">{revision.description}</p>

      {revision.admin_response && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
          <span className="font-medium">Response: </span>
          {revision.admin_response}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{new Date(revision.created_at).toLocaleString()}</span>
        {revision.resolved_at && (
          <span>Resolved: {new Date(revision.resolved_at).toLocaleString()}</span>
        )}
      </div>

      {/* Admin actions for pending/in_progress */}
      {(revision.status === 'pending' || revision.status === 'in_progress') && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          {!showResponse ? (
            <div className="flex gap-2">
              {revision.status === 'pending' && (
                <button
                  onClick={() => onUpdateStatus(revision.id, 'in_progress')}
                  disabled={updating}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  Mark In Progress
                </button>
              )}
              <button
                onClick={() => setShowResponse(true)}
                disabled={updating}
                className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50"
              >
                Complete
              </button>
              <button
                onClick={() => onUpdateStatus(revision.id, 'rejected')}
                disabled={updating}
                className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={adminResponse}
                onChange={(e) => onAdminResponseChange(e.target.value)}
                placeholder="Add a response (optional)..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateStatus(revision.id, 'completed', adminResponse)}
                  disabled={updating}
                  className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Mark Completed'}
                </button>
                <button
                  onClick={() => setShowResponse(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

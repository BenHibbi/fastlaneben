'use client'

import { useState, useEffect } from 'react'
import {
  Send,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import type { Client, RevisionRequest, ModificationType } from '@/types/database'
import { MODIFICATION_TYPES } from '@/types/database'
import { AddOnsMenu, ADD_ONS } from './AddOnsMenu'
import { AddOnsPaywall } from './AddOnsPaywall'

interface RevisionRequestFormProps {
  client: Client
  onBack: () => void
  onUpdate: () => void
  onSubmitted?: () => void
}

interface RevisionStats {
  round: number
  modificationsUsed: number
  modificationsRemaining: number
  maxRounds: number
  maxModificationsPerRound: number
}

interface PendingChange {
  id: string
  modificationType: ModificationType
  description: string
}

export function RevisionRequestForm({
  client,
  onBack,
  onUpdate,
  onSubmitted
}: RevisionRequestFormProps) {
  const [revisions, setRevisions] = useState<RevisionRequest[]>([])
  const [stats, setStats] = useState<RevisionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallLoading, setPaywallLoading] = useState(false)

  // Pending changes (local list before submission)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])

  // Selected add-ons
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])

  const [modificationType, setModificationType] = useState<ModificationType | ''>('')
  const [description, setDescription] = useState('')

  // Calculate add-ons total
  const addOnsTotal = ADD_ONS.flatMap(t => t.items)
    .filter(item => selectedAddOns.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0)

  const handleToggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev =>
      prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    )
  }

  // Handle add-ons payment confirmation
  const handlePaywallConfirm = async () => {
    setPaywallLoading(true)
    setError('')

    try {
      // 1. Accept add-on terms
      const termsRes = await fetch('/api/clients/accept-addon-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id })
      })

      if (!termsRes.ok) {
        throw new Error('Failed to accept terms')
      }

      // 2. Create checkout session for add-ons
      const checkoutRes = await fetch('/api/stripe/addon-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          addons: selectedAddOns,
          pendingRevisions: pendingChanges.map(c => ({
            modificationType: c.modificationType,
            description: c.description
          }))
        })
      })

      const checkoutData = await checkoutRes.json()

      if (checkoutData.error) {
        throw new Error(checkoutData.error)
      }

      // 3. Redirect to Stripe Checkout (or placeholder behavior for now)
      if (checkoutData.url) {
        window.location.href = checkoutData.url
      } else {
        // Placeholder: Just submit revisions without actual payment for now
        setShowPaywall(false)
        await handleSubmitAll()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment')
      setPaywallLoading(false)
    }
  }

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
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      setError('Failed to load revisions')
    } finally {
      setLoading(false)
    }
  }

  // Add a change to the local pending list
  const handleAddChange = (e: React.FormEvent) => {
    e.preventDefault()

    if (!modificationType || !description.trim()) {
      setError('Please select a type and describe your change')
      return
    }

    // Check if we have room for more changes
    const totalChanges = (stats?.modificationsUsed || 0) + pendingChanges.length
    if (stats && totalChanges >= stats.maxModificationsPerRound) {
      setError('You have reached the maximum number of changes for this round')
      return
    }

    const newChange: PendingChange = {
      id: crypto.randomUUID(),
      modificationType: modificationType as ModificationType,
      description: description.trim()
    }

    setPendingChanges((prev) => [...prev, newChange])
    setModificationType('')
    setDescription('')
    setError('')
    setSuccess('')
  }

  // Remove a pending change
  const handleRemoveChange = (id: string) => {
    setPendingChanges((prev) => prev.filter((c) => c.id !== id))
  }

  // Submit all pending changes
  const handleSubmitAll = async () => {
    if (pendingChanges.length === 0) {
      setError('Please add at least one change before submitting')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')
    setShowConfirmation(false)

    try {
      // Submit all pending changes (include add-ons in first request only)
      const results = await Promise.all(
        pendingChanges.map((change, index) =>
          fetch('/api/revisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId: client.id,
              modificationType: change.modificationType,
              description: change.description,
              // Include add-ons only in the first request to avoid duplicates
              ...(index === 0 && selectedAddOns.length > 0 && { addOns: selectedAddOns })
            })
          }).then((res) => res.json())
        )
      )

      // Check for errors
      const failedResults = results.filter((r) => r.error)
      if (failedResults.length > 0) {
        throw new Error(failedResults[0].error || 'Failed to submit some changes')
      }

      // Clear pending changes and add-ons
      setPendingChanges([])
      setSelectedAddOns([])

      const addOnsMessage = selectedAddOns.length > 0
        ? ` + ${selectedAddOns.length} add-on${selectedAddOns.length > 1 ? 's' : ''} (+$${addOnsTotal}/mo)`
        : ''
      setSuccess(`${results.length} change${results.length > 1 ? 's' : ''}${addOnsMessage} submitted successfully!`)

      // Update stats and list from the last result
      const lastResult = results[results.length - 1]
      if (lastResult.stats) {
        setStats(lastResult.stats)
      }

      // Re-fetch to get all new revisions
      await fetchRevisions()
      onUpdate()

      // Notify parent that revisions were submitted (to show building state)
      if (onSubmitted) {
        onSubmitted()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-amber-500" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-slate-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      case 'rejected':
        return 'Rejected'
      default:
        return 'Pending'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      </div>
    )
  }

  const canSubmit =
    stats && stats.modificationsRemaining > 0 && stats.round <= stats.maxRounds

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to preview
      </button>

      {/* Stats */}
      {stats && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <h3 className="font-medium mb-4">Revision Allowance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Current Round</p>
              <p className="text-2xl font-bold">
                {stats.round} <span className="text-sm font-normal text-slate-400">/ {stats.maxRounds}</span>
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Changes Remaining</p>
              <p className="text-2xl font-bold">
                {stats.modificationsRemaining}{' '}
                <span className="text-sm font-normal text-slate-400">/ {stats.maxModificationsPerRound}</span>
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{
                  width: `${(stats.modificationsUsed / stats.maxModificationsPerRound) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add-Ons Menu */}
      <AddOnsMenu
        selectedAddOns={selectedAddOns}
        onToggleAddOn={handleToggleAddOn}
      />

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-medium text-slate-900 mb-4">Add a Change</h3>

        {!canSubmit ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            You have used all your revision requests for this round. Please wait for the team to
            implement your changes before requesting more.
          </div>
        ) : (
          <form onSubmit={handleAddChange} className="space-y-4">
            {/* Type select */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Type of Change
              </label>
              <div className="relative">
                <select
                  value={modificationType}
                  onChange={(e) => setModificationType(e.target.value as ModificationType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  {MODIFICATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Describe the Change
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Be specific about what you'd like changed..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!modificationType || !description.trim()}
              className="w-full py-3 px-4 bg-slate-100 text-slate-900 border border-slate-300 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Change
            </button>
          </form>
        )}
      </div>

      {/* Pending Changes */}
      {pendingChanges.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-medium text-slate-900 mb-4">
            Pending Changes ({pendingChanges.length})
          </h3>

          <div className="space-y-3 mb-4">
            {pendingChanges.map((change) => (
              <div
                key={change.id}
                className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded">
                    {MODIFICATION_TYPES.find((t) => t.value === change.modificationType)?.label ||
                      change.modificationType}
                  </span>
                  <p className="text-sm text-slate-700 mt-2">{change.description}</p>
                </div>
                <button
                  onClick={() => handleRemoveChange(change.id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 mb-4">
              {success}
            </div>
          )}

          <button
            onClick={() => {
              // If add-ons are selected, show paywall first
              if (selectedAddOns.length > 0) {
                setShowPaywall(true)
              } else {
                setShowConfirmation(true)
              }
            }}
            disabled={submitting}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              selectedAddOns.length > 0
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <Send className="w-5 h-5" />
            {selectedAddOns.length > 0 ? (
              <>Submit + Pay Add-Ons (+${addOnsTotal}/mo)</>
            ) : (
              <>Submit Request ({pendingChanges.length} change{pendingChanges.length > 1 ? 's' : ''})</>
            )}
          </button>
        </div>
      )}

      {/* Add-Ons Paywall */}
      {showPaywall && (
        <AddOnsPaywall
          selectedAddOns={selectedAddOns}
          totalPrice={addOnsTotal}
          onConfirm={handlePaywallConfirm}
          onCancel={() => {
            setShowPaywall(false)
            setPaywallLoading(false)
          }}
          loading={paywallLoading}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-medium text-slate-900 text-lg">Confirm Submission</h3>
            </div>

            <div className="text-slate-600 mb-6">
              <p>
                Are you sure you want to submit {pendingChanges.length} change{pendingChanges.length > 1 ? 's' : ''}?
              </p>
              {selectedAddOns.length > 0 && (
                <p className="mt-2 p-3 bg-violet-50 rounded-lg text-violet-700">
                  ✨ Includes {selectedAddOns.length} add-on{selectedAddOns.length > 1 ? 's' : ''}: <strong>+${addOnsTotal}/mo</strong>
                </p>
              )}
              {stats && stats.round < stats.maxRounds && (
                <span className="block mt-2 text-amber-600 font-medium">
                  This will move you to round {stats.round + 1} of {stats.maxRounds}.
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAll}
                disabled={submitting}
                className="flex-1 py-3 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Yes, Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {revisions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-medium text-slate-900 mb-4">
            Revision History ({revisions.length})
          </h3>

          <div className="space-y-3">
            {revisions.map((revision) => (
              <div
                key={revision.id}
                className="p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded">
                      {MODIFICATION_TYPES.find((t) => t.value === revision.modification_type)?.label ||
                        revision.modification_type}
                    </span>
                    <span className="text-xs text-slate-400">
                      Round {revision.round_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {getStatusIcon(revision.status)}
                    <span className="text-slate-500">{getStatusLabel(revision.status)}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600">{revision.description}</p>

                {revision.admin_response && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-400 mb-1">Response:</p>
                    <p className="text-sm text-slate-700">{revision.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

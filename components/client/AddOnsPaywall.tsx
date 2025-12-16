'use client'

import { useState } from 'react'
import { Loader2, X, ShieldCheck, CreditCard } from 'lucide-react'
import { ADD_ONS } from './AddOnsMenu'

interface AddOnsPaywallProps {
  selectedAddOns: string[]
  totalPrice: number
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export function AddOnsPaywall({
  selectedAddOns,
  totalPrice,
  onConfirm,
  onCancel,
  loading
}: AddOnsPaywallProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Get full add-on details from IDs
  const selectedAddOnDetails = ADD_ONS.flatMap(tier => tier.items).filter(item =>
    selectedAddOns.includes(item.id)
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-6 text-white">
          <button
            onClick={onCancel}
            disabled={loading}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Complete Your Add-Ons</h2>
              <p className="text-white/80 text-sm">Review and confirm your selection</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Add-ons list */}
          <div className="space-y-3 mb-6">
            {selectedAddOnDetails.map(addon => (
              <div
                key={addon.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{addon.emoji}</span>
                  <div>
                    <p className="font-medium text-slate-900">{addon.name}</p>
                    <p className="text-sm text-slate-500">{addon.description}</p>
                  </div>
                </div>
                <span className="font-bold text-violet-600">+${addon.price}/mo</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border-2 border-violet-200 mb-6">
            <span className="font-medium text-slate-700">Monthly Add-Ons Total</span>
            <span className="text-2xl font-bold text-violet-600">+${totalPrice}/mo</span>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors mb-6">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
            />
            <div className="flex-1">
              <p className="font-medium text-slate-900">I agree to the updated Terms of Service</p>
              <p className="text-sm text-slate-500 mt-1">
                By checking this box, I confirm that I want to add these features to my subscription
                and agree to the additional monthly charges.
              </p>
            </div>
          </label>

          {/* Security note */}
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span>Secure payment powered by Stripe</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!termsAccepted || loading}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay +${totalPrice}/month</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

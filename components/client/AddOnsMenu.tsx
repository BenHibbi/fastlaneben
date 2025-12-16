'use client'

import { useState } from 'react'

interface AddOn {
  id: string
  emoji: string
  name: string
  description: string
  price: number
  features: string[]
  limitations?: string[]
  warning?: string
}

const ADD_ONS: { tier: string; tierEmoji: string; items: AddOn[] }[] = [
  {
    tier: 'ADD-ONS',
    tierEmoji: '🥇',
    items: [
      {
        id: 'online-booking',
        emoji: '🗓️',
        name: 'Online Booking',
        description: 'Let customers book without calling',
        price: 25,
        features: ['Calendly / Acuity / Tidycal', 'No payments handled', 'No custom logic']
      },
      {
        id: 'local-seo',
        emoji: '📍',
        name: 'Local SEO Boost',
        description: 'Improve your visibility on Google Maps',
        price: 20,
        features: ['Google Business Profile optimization', 'Local schema + map embed', 'NAP consistency']
      },
      {
        id: 'click-to-call',
        emoji: '📞',
        name: 'Click-to-Call Boost',
        description: 'Turn visits into phone calls',
        price: 10,
        features: ['Sticky call button', 'Mobile-first UX', 'Simple tracking (no call center)']
      }
    ]
  },
  {
    tier: 'BUSINESS',
    tierEmoji: '🥈',
    items: [
      {
        id: 'image-upgrade',
        emoji: '📸',
        name: 'Image Upgrade',
        description: 'Premium visuals for your site',
        price: 20,
        features: ['Curated stock images', 'No photo retouching', 'No client uploads']
      },
      {
        id: 'trust-pack',
        emoji: '🧭',
        name: 'Trust Pack',
        description: 'Instant credibility for visitors',
        price: 15,
        features: ['Trust badges', 'Testimonials section', 'Authority micro-copy']
      },
      {
        id: 'lead-capture',
        emoji: '🧾',
        name: 'Lead Capture Upgrade',
        description: 'Better contact forms',
        price: 15,
        features: ['Improved form UX', 'Smart field labels', 'Clean email delivery'],
        limitations: ['No CRM', 'No automation chains']
      }
    ]
  },
  {
    tier: 'STRUCTURE',
    tierEmoji: '🥉',
    items: [
      {
        id: 'extra-page',
        emoji: '🧩',
        name: 'Extra Page',
        description: 'Add one additional page',
        price: 29,
        features: ['1 extra page only', 'Same layout system', 'No custom structure'],
        warning: 'Limit to 1 page per site.'
      },
      {
        id: 'multilingual',
        emoji: '🌐',
        name: 'Multilingual Lite',
        description: 'One additional language',
        price: 30,
        features: ['AI translation', 'Fixed content', 'No manual editing included']
      }
    ]
  },
  {
    tier: 'PREMIUM',
    tierEmoji: '🤖',
    items: [
      {
        id: 'ai-assistant',
        emoji: '💬',
        name: 'Instant Info Assistant (AI)',
        description: 'Answers common questions, 24/7',
        price: 45,
        features: [
          'Answers questions based on website content',
          'Shares hours, services, contact info',
          'Helps visitors navigate the site',
          'Safe fallback responses',
          'Informational only'
        ],
        limitations: [
          'No sales promises',
          'No advice (medical / legal / pricing)',
          'No custom training',
          'No integrations'
        ]
      }
    ]
  }
]

interface AddOnsMenuProps {
  selectedAddOns: string[]
  onToggleAddOn: (addOnId: string) => void
}

export function AddOnsMenu({ selectedAddOns, onToggleAddOn }: AddOnsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedTier, setExpandedTier] = useState<string | null>(null)

  const totalSelected = selectedAddOns.length
  const totalPrice = ADD_ONS.flatMap(t => t.items)
    .filter(item => selectedAddOns.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0)

  return (
    <div className="relative">
      {/* CTA Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-[2px] transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
      >
        <div className="relative flex items-center justify-between rounded-[14px] bg-white px-5 py-4 transition-all group-hover:bg-gradient-to-r group-hover:from-violet-50 group-hover:to-indigo-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div className="text-left">
              <p className="font-bold text-slate-900">Supercharge Your Site</p>
              <p className="text-sm text-slate-500">Add powerful features</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalSelected > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2 text-xs font-bold text-white">
                {totalSelected}
              </span>
            )}
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">🚀 Power-Ups</h3>
                <p className="text-sm text-slate-500">Select add-ons for your site</p>
              </div>
              {totalSelected > 0 && (
                <div className="text-right">
                  <p className="text-sm text-slate-500">{totalSelected} selected</p>
                  <p className="font-bold text-violet-600">+${totalPrice}/mo</p>
                </div>
              )}
            </div>
          </div>

          {/* Tiers */}
          <div className="p-3">
            {ADD_ONS.map((tier) => (
              <div key={tier.tier} className="mb-2 last:mb-0">
                {/* Tier Header */}
                <button
                  onClick={() => setExpandedTier(expandedTier === tier.tier ? null : tier.tier)}
                  className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tier.tierEmoji}</span>
                    <span className="font-semibold text-slate-700">{tier.tier}</span>
                    <span className="text-xs text-slate-400">({tier.items.length} add-ons)</span>
                  </div>
                  <svg
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      expandedTier === tier.tier ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Tier Items */}
                {expandedTier === tier.tier && (
                  <div className="mt-2 space-y-2 pl-2">
                    {tier.items.map((addon) => {
                      const isSelected = selectedAddOns.includes(addon.id)
                      return (
                        <div
                          key={addon.id}
                          onClick={() => onToggleAddOn(addon.id)}
                          className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                            isSelected
                              ? 'border-violet-500 bg-violet-50 shadow-md shadow-violet-100'
                              : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{addon.emoji}</span>
                              <div>
                                <h4 className="font-semibold text-slate-900">{addon.name}</h4>
                                <p className="text-sm text-slate-500">{addon.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="whitespace-nowrap font-bold text-violet-600">
                                +${addon.price}/mo
                              </span>
                              <div
                                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                                  isSelected
                                    ? 'border-violet-500 bg-violet-500 text-white'
                                    : 'border-slate-300'
                                }`}
                              >
                                {isSelected && (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Features */}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {addon.features.map((feature, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                              >
                                <svg className="h-3 w-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {feature}
                              </span>
                            ))}
                          </div>

                          {/* Limitations */}
                          {addon.limitations && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {addon.limitations.map((limitation, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-600"
                                >
                                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  {limitation}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Warning */}
                          {addon.warning && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              {addon.warning}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          {totalSelected > 0 && (
            <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Selected add-ons will be added to your revision request</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 font-semibold text-white transition-all hover:shadow-lg hover:shadow-violet-500/25"
                >
                  Done (+${totalPrice}/mo)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Add-ons Summary (when closed) */}
      {!isOpen && totalSelected > 0 && (
        <div className="mt-3 rounded-xl bg-violet-50 p-3">
          <p className="mb-2 text-xs font-medium text-violet-700">Selected add-ons:</p>
          <div className="flex flex-wrap gap-2">
            {ADD_ONS.flatMap(t => t.items)
              .filter(item => selectedAddOns.includes(item.id))
              .map(addon => (
                <span
                  key={addon.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm shadow-sm"
                >
                  <span>{addon.emoji}</span>
                  <span className="font-medium text-slate-700">{addon.name}</span>
                  <span className="text-violet-600">+${addon.price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleAddOn(addon.id)
                    }}
                    className="ml-1 text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
          <p className="mt-2 text-right text-sm font-bold text-violet-700">
            Total: +${totalPrice}/month
          </p>
        </div>
      )}
    </div>
  )
}

// Export the ADD_ONS for use in other components
export { ADD_ONS }
export type { AddOn }

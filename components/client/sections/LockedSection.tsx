'use client'

import type { Client } from '@/types/database'

interface LockedSectionProps {
  client: Client
}

export function LockedSection({ client }: LockedSectionProps) {
  const intakeData = client.intake_data as Record<string, unknown> | null

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Animated loading */}
      <div className="mb-8">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-[#C3F53C] border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🚀</span>
          </div>
        </div>
      </div>

      <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
        Your preview is being built
      </h1>

      <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
        We are crafting something beautiful for {client.business_name}. You will get notified when it is ready to review.
      </p>

      {/* Summary card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-left mb-8">
        <h2 className="font-medium text-slate-900 mb-4">Your submission</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Business</dt>
            <dd className="font-medium text-slate-900">{client.business_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Industry</dt>
            <dd className="font-medium text-slate-900">
              {client.industry}
              {client.industry === 'Other' && typeof intakeData?.industry_other === 'string' && (
                <span className="text-slate-600"> — {intakeData.industry_other}</span>
              )}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Location</dt>
            <dd className="font-medium text-slate-900">{client.location}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Style</dt>
            <dd className="font-medium text-slate-900">{intakeData?.style as string || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Goal</dt>
            <dd className="font-medium text-slate-900">
              {intakeData?.goal as string || '—'}
              {intakeData?.goal === 'Other' && typeof intakeData?.goal_other === 'string' && (
                <span className="text-slate-600"> — {intakeData.goal_other}</span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <p className="text-sm text-slate-400">
        We typically deliver previews within 24-48 hours.
      </p>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { STATE_CONFIG, getStateRoute } from '@/lib/state-machine'
import type { ClientState } from '@/types/database'

export default async function LockedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!client) {
    redirect('/client/intake')
  }

  // Redirect if not in correct state
  if (client.state !== 'LOCKED') {
    redirect(getStateRoute(client.state as ClientState))
  }

  const config = STATE_CONFIG.LOCKED

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Animated loader */}
      <div className="mb-8">
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-[#C3F53C] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🎨</span>
          </div>
        </div>
      </div>

      <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full mb-4">
        {config.label}
      </span>

      <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
        We're crafting your preview
      </h1>

      <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
        Our team is building a custom mockup based on your inputs. You'll receive an email when it's ready for review.
      </p>

      {/* What we're working with */}
      <div className="bg-slate-50 rounded-2xl p-6 text-left mb-8">
        <h2 className="font-medium text-slate-900 mb-4">Your submission</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Business</dt>
            <dd className="text-slate-900 font-medium">{client.business_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Industry</dt>
            <dd className="text-slate-900">{client.industry}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Location</dt>
            <dd className="text-slate-900">{client.location}</dd>
          </div>
          {client.intake_data && typeof client.intake_data === 'object' && (
            <>
              <div className="flex justify-between">
                <dt className="text-slate-500">Goal</dt>
                <dd className="text-slate-900">{(client.intake_data as Record<string, unknown>).goal as string}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Style</dt>
                <dd className="text-slate-900">{(client.intake_data as Record<string, unknown>).style as string}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {/* Timeline */}
      <div className="text-sm text-slate-400">
        Submitted {new Date(client.state_changed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })}
      </div>
    </div>
  )
}

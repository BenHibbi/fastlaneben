import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStateRoute } from '@/lib/state-machine'
import type { ClientState } from '@/types/database'
import Link from 'next/link'

export default async function LivePage() {
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

  if (client.state !== 'LIVE') {
    redirect(getStateRoute(client.state as ClientState))
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Success animation */}
      <div className="mb-8">
        <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-5xl">🎉</span>
        </div>
      </div>

      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full mb-4">
        Live
      </span>

      <h1 className="font-serif-display text-3xl sm:text-4xl text-slate-900 mb-4">
        Your site is live!
      </h1>

      <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">
        Congratulations! Your website is now published and ready to share with the world.
      </p>

      {/* Live URL */}
      {client.live_url && (
        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <p className="text-sm text-slate-500 mb-2">Your website</p>
          <a
            href={client.live_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xl font-medium text-slate-900 hover:text-[#C3F53C] transition-colors break-all"
          >
            {client.live_url.replace(/^https?:\/\//, '')}
          </a>
          <div className="mt-4 flex justify-center gap-3">
            <a
              href={client.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
              Visit Site →
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(client.live_url!)}
              className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">✓</p>
          <p className="text-sm text-slate-500">SSL Secured</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">✓</p>
          <p className="text-sm text-slate-500">Mobile Ready</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-2xl font-bold text-slate-900">✓</p>
          <p className="text-sm text-slate-500">SEO Optimized</p>
        </div>
      </div>

      {/* Support CTA */}
      <div className="bg-slate-900 text-white rounded-2xl p-6">
        <h2 className="font-medium text-lg mb-2">Need changes or have questions?</h2>
        <p className="text-slate-400 text-sm mb-4">
          Your subscription includes unlimited support requests.
        </p>
        <Link
          href="/client/support"
          className="inline-block px-6 py-3 bg-[#C3F53C] text-slate-900 rounded-xl font-bold hover:bg-[#b4e62b] transition-colors"
        >
          Request Support
        </Link>
      </div>

      {/* Site info */}
      <div className="mt-8 text-sm text-slate-400">
        <p>Site for {client.business_name}</p>
        <p>Live since {new Date(client.state_changed_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}</p>
      </div>
    </div>
  )
}

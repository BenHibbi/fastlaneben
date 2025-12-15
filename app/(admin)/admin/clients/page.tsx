import { createClient } from '@/lib/supabase/server'
import { STATE_CONFIG } from '@/lib/state-machine'
import Link from 'next/link'
import type { ClientState, Client } from '@/types/database'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('clients')
    .select('*')
    .order('updated_at', { ascending: false })

  if (params.state) {
    query = query.eq('state', params.state)
  }

  if (params.search) {
    query = query.or(`business_name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  const { data: clients } = await query
  const allClients = (clients || []) as Client[]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <form className="flex gap-4" method="get">
          <div className="flex-1">
            <input
              type="text"
              name="search"
              placeholder="Search by name or email..."
              defaultValue={params.search}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-1 focus:ring-slate-200 outline-none"
            />
          </div>
          <select
            name="state"
            defaultValue={params.state}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:border-slate-400 outline-none"
          >
            <option value="">All States</option>
            {(['INTAKE', 'LOCKED', 'PREVIEW_READY', 'ACTIVATION', 'FINAL_ONBOARDING', 'LIVE', 'SUPPORT'] as ClientState[]).map(state => (
              <option key={state} value={state}>{STATE_CONFIG[state].label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
          >
            Filter
          </button>
          {(params.state || params.search) && (
            <Link
              href="/admin/clients"
              className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Client list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Business</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">State</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Subscription</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Updated</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allClients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{client.business_name || 'Unnamed'}</p>
                  <p className="text-sm text-slate-500">{client.industry}</p>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{client.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                    client.state === 'LIVE' ? 'bg-green-100 text-green-700' :
                    client.state === 'LOCKED' ? 'bg-amber-100 text-amber-700' :
                    client.state === 'PREVIEW_READY' ? 'bg-purple-100 text-purple-700' :
                    client.state === 'ACTIVATION' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {STATE_CONFIG[client.state].label}
                    {client.revision_requested && (
                      <span className="w-2 h-2 bg-amber-500 rounded-full" title="Revision requested" />
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {client.subscription_status ? (
                    <span className={`text-xs font-medium ${
                      client.subscription_status === 'active' ? 'text-green-600' :
                      client.subscription_status === 'past_due' ? 'text-red-600' :
                      'text-slate-500'
                    }`}>
                      {client.subscription_status}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {new Date(client.updated_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {allClients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No clients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

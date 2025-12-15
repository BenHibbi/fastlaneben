import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth/admin'
import { STATE_CONFIG } from '@/lib/state-machine'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ClientState, Client } from '@/types/database'

export default async function AdminDashboard() {
  // Verify admin access
  const adminUser = await getAdminUser()
  if (!adminUser) {
    redirect('/login?next=/admin')
  }

  const supabase = createAdminClient()

  // Get all clients
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('updated_at', { ascending: false })

  const allClients = (clients || []) as Client[]

  // Get pending support requests count
  const { count: pendingSupport } = await supabase
    .from('support_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Group clients by state
  const clientsByState = allClients.reduce((acc, client) => {
    if (!acc[client.state]) acc[client.state] = []
    acc[client.state].push(client)
    return acc
  }, {} as Record<ClientState, Client[]>)

  // Stats
  const totalClients = allClients.length
  const activeSubscriptions = allClients.filter(c => c.subscription_status === 'active').length
  const needsAttention = allClients.filter(c =>
    c.state === 'LOCKED' ||
    c.state === 'FINAL_ONBOARDING' ||
    c.revision_requested
  ).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Total Clients</p>
          <p className="text-3xl font-bold text-slate-900">{totalClients}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Active Subscriptions</p>
          <p className="text-3xl font-bold text-green-600">{activeSubscriptions}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Needs Attention</p>
          <p className="text-3xl font-bold text-amber-600">{needsAttention}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Pending Support</p>
          <p className="text-3xl font-bold text-purple-600">{pendingSupport || 0}</p>
        </div>
      </div>

      {/* Pipeline view */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-medium text-slate-900">Client Pipeline</h2>
        </div>
        <div className="grid grid-cols-7 divide-x divide-slate-200">
          {(['INTAKE', 'LOCKED', 'PREVIEW_READY', 'ACTIVATION', 'FINAL_ONBOARDING', 'LIVE', 'SUPPORT'] as ClientState[]).map(state => {
            const stateClients = clientsByState[state] || []
            const config = STATE_CONFIG[state]
            return (
              <div key={state} className="p-3">
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {config.label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{stateClients.length}</p>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stateClients.slice(0, 5).map(client => (
                    <Link
                      key={client.id}
                      href={`/admin/clients/${client.id}`}
                      className="block p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {client.business_name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{client.email}</p>
                      {client.revision_requested && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
                          Revision
                        </span>
                      )}
                    </Link>
                  ))}
                  {stateClients.length > 5 && (
                    <Link
                      href={`/admin/clients?state=${state}`}
                      className="block text-xs text-center text-slate-500 hover:text-slate-700"
                    >
                      +{stateClients.length - 5} more
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-medium text-slate-900">Recent Clients</h2>
          <Link href="/admin/clients" className="text-sm text-slate-500 hover:text-slate-700">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {allClients.slice(0, 10).map(client => (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="font-medium text-slate-900">{client.business_name || 'Unnamed'}</p>
                <p className="text-sm text-slate-500">{client.email}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                  client.state === 'LIVE' ? 'bg-green-100 text-green-700' :
                  client.state === 'LOCKED' ? 'bg-amber-100 text-amber-700' :
                  client.state === 'PREVIEW_READY' ? 'bg-purple-100 text-purple-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {STATE_CONFIG[client.state].label}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(client.updated_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

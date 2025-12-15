import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const REQUEST_TYPES: Record<string, string> = {
  content_update: 'Content Update',
  design_change: 'Design Tweak',
  new_feature: 'New Feature',
  bug_report: 'Bug Report',
  question: 'General Question'
}

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('support_requests')
    .select(`
      *,
      clients (
        id,
        business_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data: requests } = await query

  // Get counts by status
  const { count: pendingCount } = await supabase
    .from('support_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: inProgressCount } = await supabase
    .from('support_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'in_progress')

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Support Requests</h1>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        <Link
          href="/admin/support"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !params.status ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/support?status=pending"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            params.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Pending ({pendingCount || 0})
        </Link>
        <Link
          href="/admin/support?status=in_progress"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            params.status === 'in_progress' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          In Progress ({inProgressCount || 0})
        </Link>
        <Link
          href="/admin/support?status=resolved"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            params.status === 'resolved' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Resolved
        </Link>
      </div>

      {/* Request list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {requests && requests.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {requests.map((request: Record<string, unknown>) => {
              const client = request.clients as Record<string, string> | null
              return (
                <div key={request.id as string} className="p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-slate-900">
                          {REQUEST_TYPES[request.request_type as string] || request.request_type}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {request.status as string}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{request.description as string}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        {client && (
                          <Link
                            href={`/admin/clients/${client.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {client.business_name || client.email}
                          </Link>
                        )}
                        <span>{new Date(request.created_at as string).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <SupportActions
                        requestId={request.id as string}
                        currentStatus={request.status as string}
                        adminNotes={request.admin_notes as string | null}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500">
            No support requests found
          </div>
        )}
      </div>
    </div>
  )
}

function SupportActions({
  requestId,
  currentStatus,
  adminNotes,
}: {
  requestId: string
  currentStatus: string
  adminNotes: string | null
}) {
  return (
    <form action={`/api/admin/support/${requestId}`} method="post" className="flex items-center gap-2">
      <select
        name="status"
        defaultValue={currentStatus}
        className="px-2 py-1 border border-slate-200 rounded text-sm"
      >
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>
      <button
        type="submit"
        className="px-3 py-1 bg-slate-900 text-white rounded text-sm font-medium hover:bg-slate-800"
      >
        Update
      </button>
    </form>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get form data
  const formData = await request.formData()
  const status = formData.get('status') as string
  const adminNotes = formData.get('admin_notes') as string | null

  // Update support request using service-role client (bypasses RLS)
  const adminSupabase = createAdminClient()
  const updateData: Record<string, unknown> = {
    status,
    ...(adminNotes !== null && { admin_notes: adminNotes }),
    ...(status === 'resolved' && { resolved_at: new Date().toISOString() }),
  }

  await adminSupabase
    .from('support_requests')
    .update(updateData as never)
    .eq('id', id)

  // Redirect back
  return NextResponse.redirect(new URL('/admin/support', request.url), { status: 303 })
}

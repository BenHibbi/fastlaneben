import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser } from '@/lib/auth/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check if user is admin
  const user = await getAdminUser()
  if (!user) {
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

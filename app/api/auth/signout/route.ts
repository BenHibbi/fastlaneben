import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Use the request URL origin to redirect back to the app, not Supabase
  const url = new URL(request.url)
  return NextResponse.redirect(new URL('/', url.origin), {
    status: 302,
  })
}

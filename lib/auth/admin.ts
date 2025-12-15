import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())

export function isAdminEmail(email: string | undefined | null): boolean {
  return ADMIN_EMAILS.includes(email?.toLowerCase() || '')
}

export async function verifyAdmin(): Promise<User> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('[verifyAdmin] Auth error:', error.message)
    throw new Error('Unauthorized')
  }

  if (!user) {
    console.error('[verifyAdmin] No user found in session')
    throw new Error('Unauthorized')
  }

  if (!isAdminEmail(user.email)) {
    console.error('[verifyAdmin] User not admin:', user.email)
    throw new Error('Unauthorized')
  }

  return user
}

export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return null
  }

  return user
}

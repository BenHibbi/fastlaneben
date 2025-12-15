import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/auth/admin'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAdminUser()

  if (!user) {
    redirect('/login?next=/admin')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin header */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="font-bold text-lg">
                Fastlane Admin
              </Link>
              <nav className="flex gap-6 text-sm">
                <Link href="/admin" className="text-slate-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/clients" className="text-slate-300 hover:text-white transition-colors">
                  Clients
                </Link>
                <Link href="/admin/support" className="text-slate-300 hover:text-white transition-colors">
                  Support
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">{user.email}</span>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

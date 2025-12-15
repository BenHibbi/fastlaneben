'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Shield, AlertTriangle, HelpCircle, ArrowLeft } from 'lucide-react'

const navItems = [
  { href: '/terms', label: 'Terms of Service', icon: FileText },
  { href: '/privacy', label: 'Privacy Policy', icon: Shield },
  { href: '/acceptable-use', label: 'Acceptable Use', icon: AlertTriangle },
  { href: '/faq', label: 'FAQ', icon: HelpCircle },
]

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#C3F53C] border-b-4 border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowLeft size={20} className="text-[#C3F53C]" />
              </div>
              <span className="font-serif-display font-bold italic text-2xl sm:text-3xl tracking-tight text-slate-900">
                Fastlane.
              </span>
            </Link>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 opacity-70">Legal Documents</div>
              <div className="text-sm font-medium text-slate-900">CRUSH DIGITAL ATELIER LLC</div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 shrink-0">
            <nav className="lg:sticky lg:top-8 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-3">
                Documents
              </div>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-lg'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-md'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[#C3F53C]' : 'text-slate-400'} />
                    {item.label}
                  </Link>
                )
              })}

              {/* Last Updated */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="px-3 text-xs text-slate-400">
                  <div className="font-medium mb-1">Last Updated</div>
                  <div>December 15, 2024</div>
                </div>
              </div>

              {/* Contact */}
              <div className="mt-4 px-3">
                <div className="text-xs text-slate-400">
                  <div className="font-medium mb-1">Questions?</div>
                  <a href="mailto:eric@crushhh.co" className="text-slate-600 hover:text-[#84a329] transition-colors">
                    eric@crushhh.co
                  </a>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 lg:p-12">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span>&copy; 2026 CRUSH DIGITAL ATELIER LLC</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Sheridan, WY</span>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Fastlane
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

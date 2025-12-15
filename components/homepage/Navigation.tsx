'use client'

import { Menu, X } from 'lucide-react'

interface NavigationProps {
  scrolled: boolean
  isMenuOpen: boolean
  onMenuToggle: () => void
  isLoading: boolean
  onCheckout: () => void
}

export function Navigation({ scrolled, isMenuOpen, onMenuToggle, isLoading, onCheckout }: NavigationProps) {
  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) border-b ${scrolled ? 'bg-white/80 backdrop-blur-xl border-slate-200 py-2.5 sm:py-3 shadow-sm' : 'bg-transparent border-transparent py-4 sm:py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-2 group cursor-pointer z-50">
          <span className="font-serif-display font-bold italic text-2xl tracking-tight text-slate-900 group-hover:text-lime-600 transition-colors duration-300">
            Fastlane.
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'How it Works', href: '#how-it-works' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Login', href: '/login' }
          ].map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group">
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C3F53C] transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></span>
            </a>
          ))}
          <button
            onClick={onCheckout}
            disabled={isLoading}
            className="px-6 py-3 text-sm font-medium border border-slate-200 rounded-2xl text-slate-900 hover:border-[#C3F53C] hover:bg-[#C3F53C]/10 transition-all bg-white/50 backdrop-blur-sm active:scale-95 shadow-sm disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Get Started'}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-slate-900 z-50" onClick={onMenuToggle}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  )
}

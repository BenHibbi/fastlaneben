'use client'

interface MobileMenuProps {
  isOpen: boolean
  isLoading: boolean
  onCheckout: () => void
}

export function MobileMenu({ isOpen, isLoading, onCheckout }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-20 sm:pt-28 px-4 sm:px-6 md:hidden animate-blur-fade duration-300">
      <div className="flex flex-col gap-6 sm:gap-8 text-xl sm:text-2xl font-serif-display">
        <a href="#how-it-works" className="border-b border-slate-100 pb-4 text-slate-900">How it Works</a>
        <a href="#pricing" className="border-b border-slate-100 pb-4 text-slate-900">Pricing</a>
        <a href="/login" className="border-b border-slate-100 pb-4 text-slate-900">Login</a>
        <button
          onClick={onCheckout}
          disabled={isLoading}
          className="bg-[#C3F53C] text-slate-900 py-4 rounded-2xl font-sans-body font-bold shadow-xl shadow-lime-300/20 active:scale-95 transition-transform disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Get Started'}
        </button>
      </div>
    </div>
  )
}

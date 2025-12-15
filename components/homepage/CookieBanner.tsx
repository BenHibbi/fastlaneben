'use client'

interface CookieBannerProps {
  show: boolean
  onClose: () => void
}

export function CookieBanner({ show, onClose }: CookieBannerProps) {
  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-blur-fade">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 max-w-[320px] flex items-center gap-4">
        <p className="text-slate-400 text-[13px] leading-relaxed">
          We use cookies to run ads, and analyze traffic.
        </p>
        <button
          onClick={onClose}
          className="shrink-0 px-4 py-1.5 border border-slate-200 text-slate-400 text-sm rounded-lg hover:border-slate-300 hover:text-slate-500 transition-colors"
        >
          Okay
        </button>
      </div>
    </div>
  )
}

'use client'

import { Hammer } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative bg-[#C3F53C] text-slate-900 pt-12 sm:pt-16 md:pt-24 overflow-hidden z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16 md:mb-24">
          <div className="pt-4 md:pt-8">
            <div className="grid grid-cols-2 gap-4 sm:gap-8 text-sm font-medium">
              <div className="flex flex-col gap-3 sm:gap-4">
                <a href="#how-it-works" className="hover:underline decoration-2 underline-offset-4">How it works</a>
                <a href="#pricing" className="hover:underline decoration-2 underline-offset-4">Pricing</a>
                <a href="/faq" className="hover:underline decoration-2 underline-offset-4">FAQ</a>
              </div>
              <div className="flex flex-col gap-3 sm:gap-4">
                <a href="/login" className="hover:underline decoration-2 underline-offset-4">Login</a>
                <a href="/terms" className="hover:underline decoration-2 underline-offset-4">Terms</a>
                <a href="/privacy" className="hover:underline decoration-2 underline-offset-4">Privacy</a>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div className="bg-slate-900 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl text-white shadow-2xl shadow-slate-900/10 transform sm:rotate-1 hover:rotate-0 transition-transform duration-500">
              <h4 className="font-serif-display text-xl sm:text-2xl mb-3 sm:mb-4">Join the waitlist.</h4>
              <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">Get early access to new batches.</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@company.com"
                  className="bg-white/10 border-transparent text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#C3F53C]"
                />
                <button className="bg-white text-slate-900 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-slate-200 transition-colors">
                  &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900/10 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-2 pb-6 sm:pb-8">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-50">
            &copy; 2026 Fastlane Inc.
          </div>
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-50 text-right">
            Alberta &bull; Wyoming &bull; R&eacute;union
          </div>
        </div>
      </div>

      <div className="w-full text-center leading-none relative">
        <h1 className="font-serif-display font-black italic text-[15vw] sm:text-[18vw] text-slate-900 tracking-tighter leading-[0.75] select-none speed-lines">
          FASTLANE
          <span className="speed-line-extra speed-line-extra-1"></span>
          <span className="speed-line-extra speed-line-extra-2"></span>
          <span className="speed-line-extra speed-line-extra-3"></span>
          <span className="speed-line-extra-4"></span>
          <span className="speed-line-extra-5"></span>
          <span className="speed-line-extra-6"></span>
        </h1>
      </div>
    </footer>
  )
}

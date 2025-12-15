'use client'

import { ArrowRight } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

interface FinalCTASectionProps {
  isLoading: boolean
  onCheckout: () => void
}

export function FinalCTASection({ isLoading, onCheckout }: FinalCTASectionProps) {
  return (
    <section className="min-h-screen flex items-center justify-center py-20 md:py-32 bg-[#020617] text-center relative overflow-hidden z-10">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 w-full">
        <ScrollReveal>
          <h2 className="font-serif-display text-3xl sm:text-4xl md:text-6xl text-white mb-4 sm:mb-6 leading-tight">
            Your website should <br/> work for you.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl mb-8 sm:mb-10">
            Not stress you out. <br/> Not drain your cash.
          </p>
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            <button
              onClick={onCheckout}
              disabled={isLoading}
              className="px-8 sm:px-12 py-4 sm:py-5 bg-[#C3F53C] text-slate-900 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold transition-all hover:bg-[#b4e62b] hover:shadow-xl hover:shadow-lime-300/20 hover:-translate-y-1 active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Get live within 7 days'} <ArrowRight size={20} />
            </button>
            <div className="text-xs sm:text-sm font-medium text-white">
              From $39/month. <span className="text-slate-500">Hosting included.</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

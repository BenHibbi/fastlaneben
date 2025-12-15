'use client'

import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function PainPointSection() {
  return (
    <div className="sticky top-0 min-h-screen flex items-center justify-center py-16 md:py-24 bg-white">
      <ScrollReveal className="w-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 mb-6 sm:mb-10 leading-[1.1] tracking-tight">
            Your website is broken.
          </h2>
          <p className="font-serif-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-slate-300 leading-[1.3] tracking-tight">
            Losing customers <span className="inline-block">😬</span> Looking unprofessional <span className="inline-block">🤷</span>
            <br className="hidden sm:block" />
            <span className="inline-block mt-2 sm:mt-0">Competitor envy <span className="inline-block">👀</span> DIY nightmares <span className="inline-block">🪤</span></span>
          </p>
        </div>
      </ScrollReveal>
    </div>
  )
}

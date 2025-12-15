'use client'

import { Smartphone, Search, Settings } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function FeaturesSection() {
  return (
    <section className="py-24 md:py-32 lg:py-40 lime-mesh-bg relative rounded-t-[2rem] sm:rounded-t-[3rem] -mt-24">
      {/* Top fade gradient */}
      <div className="absolute top-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-b from-white to-transparent pointer-events-none z-0 rounded-t-[2rem] sm:rounded-t-[3rem]"></div>
      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-0"></div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal>
          <div className="mb-10 md:mb-16 text-center">
            <h2 className="font-serif-display text-2xl sm:text-3xl md:text-4xl text-slate-900 mb-3 sm:mb-4">Features (No Fluff)</h2>
            <p className="text-slate-500 text-base sm:text-lg">Everything you need. Nothing you don&apos;t.</p>
          </div>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <ScrollReveal delay={100} className="h-full">
            <div className="group h-full bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-white rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-center mb-4 sm:mb-6 shadow-sm group-hover:border-[#C3F53C] group-hover:bg-[#C3F53C] group-hover:text-slate-900 transition-colors duration-300">
                <Smartphone size={24} className="text-slate-400 group-hover:text-slate-900 transition-colors duration-300 sm:w-7 sm:h-7" />
              </div>
              <h3 className="font-serif-display text-xl sm:text-2xl text-slate-900 mb-2 sm:mb-3">Mobile-perfect</h3>
              <p className="font-sans-body text-slate-600 leading-relaxed text-sm">Your site works flawlessly on phones. That&apos;s where your customers are.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200} className="h-full">
            <div className="group h-full bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-white rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-center mb-4 sm:mb-6 shadow-sm group-hover:border-[#C3F53C] group-hover:bg-[#C3F53C] group-hover:text-slate-900 transition-colors duration-300">
                <Search size={24} className="text-slate-400 group-hover:text-slate-900 transition-colors duration-300 sm:w-7 sm:h-7" />
              </div>
              <h3 className="font-serif-display text-xl sm:text-2xl text-slate-900 mb-2 sm:mb-3">Google-ready</h3>
              <p className="font-sans-body text-slate-600 leading-relaxed text-sm">Built to show up when people search &quot;near me&quot;. Optimized for local SEO out of the box.</p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={300} className="h-full sm:col-span-2 md:col-span-1">
            <div className="group h-full bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 sm:w-14 h-12 sm:h-14 bg-white rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-center mb-4 sm:mb-6 shadow-sm group-hover:border-[#C3F53C] group-hover:bg-[#C3F53C] group-hover:text-slate-900 transition-colors duration-300">
                <Settings size={24} className="text-slate-400 group-hover:text-slate-900 transition-colors duration-300 sm:w-7 sm:h-7" />
              </div>
              <h3 className="font-serif-display text-xl sm:text-2xl text-slate-900 mb-2 sm:mb-3">Managed for you</h3>
              <p className="font-sans-body text-slate-600 leading-relaxed text-sm">Change a price. Add a photo. Update a service. We take care of it so you can work.</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

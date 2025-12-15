'use client'

import { X, Check, Zap, LayoutTemplate, Hammer } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function ComparisonSection() {
  return (
    <section className="py-16 md:py-24 bg-white relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-10 md:mb-16">
            <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4">The old choices suck.</h2>
            <p className="text-slate-500 font-sans-body">Stop choosing between expensive agencies and frustrating DIY.</p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 relative">
          {/* Card 1: Agencies */}
          <ScrollReveal delay={100}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden group hover:bg-red-50/50 transition-all duration-300 border border-slate-200/80 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 h-full">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-400"></div>
              <h3 className="font-serif-display text-xl sm:text-2xl text-slate-900 mb-5 flex items-center gap-3">
                Agencies
                <span className="text-[9px] font-sans-body font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider">$$$</span>
              </h3>
              <ul className="space-y-3 font-sans-body">
                {[
                  "$3,000–$10,000 upfront",
                  "4–8 weeks timeline",
                  "Endless revisions",
                  "Locked into their stack"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <div className="min-w-[20px] h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center">
                      <X size={12} />
                    </div>
                    <span className="text-sm">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Card 2: DIY */}
          <ScrollReveal delay={200}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden group hover:bg-orange-50/50 transition-all duration-300 border border-slate-200/80 shadow-xl shadow-slate-900/5 ring-1 ring-slate-900/5 h-full">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-400"></div>
              <h3 className="font-serif-display text-xl sm:text-2xl text-slate-900 mb-5 flex items-center gap-3">
                DIY
                <span className="text-[9px] font-sans-body font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Slow</span>
              </h3>
              <ul className="space-y-3 font-sans-body">
                {[
                  "Cheap but looks cheap",
                  "Weeks learning tools",
                  "Generic templates",
                  "No one to help you"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <div className="min-w-[20px] h-5 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                      <X size={12} />
                    </div>
                    <span className="text-sm">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Card 3: Fastlane */}
          <ScrollReveal delay={300}>
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-lime-900/15 transition-all duration-300 border border-lime-300/50 shadow-xl shadow-lime-900/10 ring-1 ring-lime-500/20 h-full">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C3F53C]"></div>
              <h3 className="font-serif-display text-xl sm:text-2xl text-slate-900 mb-5 flex items-center gap-3">
                Fastlane
                <span className="text-[9px] font-sans-body font-bold text-lime-900 bg-[#C3F53C] px-2 py-0.5 rounded-full uppercase tracking-wider">Better</span>
              </h3>
              <ul className="space-y-3 font-sans-body">
                {[
                  { text: "$0 upfront, $39/mo", icon: <Check size={12} /> },
                  { text: "Live within 7 days", icon: <Zap size={12} /> },
                  { text: "Custom, not template", icon: <LayoutTemplate size={12} /> },
                  { text: "We handle everything", icon: <Hammer size={12} /> }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-900">
                    <div className="min-w-[20px] h-5 rounded-full bg-[#C3F53C] text-slate-900 flex items-center justify-center shadow-md shadow-lime-300/40">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

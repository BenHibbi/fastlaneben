'use client'

import { ArrowUpRight } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function PortfolioSection() {
  return (
    <section className="min-h-screen flex items-center py-16 md:py-24 bg-white relative z-10">
      {/* Bottom fade gradient to grey */}
      <div className="absolute bottom-0 left-0 right-0 h-32 md:h-48 bg-gradient-to-b from-transparent to-[#fafafa] pointer-events-none z-0"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center w-full relative z-10">
        <ScrollReveal>
          <h2 className="font-serif-display text-2xl sm:text-3xl md:text-4xl text-slate-900 mb-2">PORTFOLIO</h2>
          <p className="text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs font-bold mb-10 md:mb-16">(Real examples. Real businesses.)</p>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3].map((i) => (
            <ScrollReveal key={i} delay={i * 150}>
              <div className="group cursor-pointer">
                <div className="bg-slate-100 rounded-2xl overflow-hidden aspect-[4/5] border border-slate-200 relative mb-6 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) group-hover:-translate-y-2 group-hover:shadow-2xl shadow-sm">
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                    <div className="w-3/4 h-3/4 bg-white shadow-lg rounded-xl border border-slate-100 overflow-hidden relative transition-transform duration-500 group-hover:scale-105">
                      <div className="h-4 bg-slate-100 border-b border-slate-200 flex items-center px-2 gap-1">
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      </div>
                      <div className="p-4">
                        <div className="h-2 w-1/3 bg-slate-100 rounded mb-2"></div>
                        <div className="h-2 w-1/2 bg-slate-100 rounded mb-4"></div>
                        <div className="space-y-2">
                          <div className="h-16 bg-lime-50 rounded"></div>
                          <div className="h-16 bg-slate-50 rounded"></div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                        <span className="bg-[#C3F53C] text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2">
                          View Site <ArrowUpRight size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-lime-600 transition-colors">Project {i}</h3>
                <p className="text-xs text-slate-500">Local Business &bull; Seattle, WA</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

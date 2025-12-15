'use client'

import { Check, ChevronRight } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

interface PricingSectionProps {
  isAnnual: boolean
  setIsAnnual: (annual: boolean) => void
  isLoading: boolean
  onCheckout: () => void
}

export function PricingSection({ isAnnual, setIsAnnual, isLoading, onCheckout }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-16 md:py-24 lg:py-32 relative overflow-hidden bg-white z-10">
      <div className="absolute bottom-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-lime-200/40 rounded-full blur-[120px] -z-10 translate-x-1/2 translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-blue-100/50 rounded-full blur-[100px] -z-10 -translate-x-1/3 translate-y-1/2" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* Left Column: Pricing Copy */}
          <ScrollReveal>
            <div className="text-center lg:text-left lg:pl-8">
              <div className="inline-block px-3 py-1 bg-lime-50 text-lime-700 text-[10px] font-bold uppercase tracking-widest rounded-full mb-4 sm:mb-6">Pricing</div>
              <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl text-slate-900 mb-4 sm:mb-6 leading-tight">One plan. <br/>Zero surprises.</h2>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!isAnnual ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 border border-slate-200'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isAnnual ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 border border-slate-200'}`}
                >
                  Annual
                </button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-3 sm:mb-4 text-slate-900 font-medium text-base sm:text-lg">
                <span>$0 upfront</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span>{isAnnual ? 'Pay once, save big' : 'Cancel Anytime'}</span>
              </div>

              <p className="text-slate-500 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
                We build it, host it, and manage it for you. <br className="hidden sm:block" />You get a premium site without the agency <br className="hidden sm:block" />price tag or DIY headaches.
              </p>
            </div>
          </ScrollReveal>

          {/* Right Column: Receipt */}
          <ScrollReveal delay={200}>
            <div className="relative group perspective-1000">
              <div className="flex justify-center -mb-1 relative z-20">
                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]"></div>
                </div>
              </div>

              <div className="bg-white w-full max-w-sm mx-auto rounded-t-lg shadow-2xl shadow-slate-400/20 overflow-hidden relative mb-4 transform hover:scale-[1.01] hover:-rotate-1 transition-transform duration-500 ease-out border border-slate-100">
                <div className="bg-[#1a1a1a] p-5 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="font-serif-display font-bold italic text-[#C3F53C] text-2xl mb-1 relative z-10">Fastlane.</div>
                  <div className="text-slate-500 text-[9px] uppercase tracking-[0.2em] font-medium relative z-10">Official Receipt</div>
                </div>

                <div className="p-5 pb-6 bg-white relative">
                  <div className="absolute inset-0 bg-[#fffdf5] opacity-20 pointer-events-none"></div>

                  <div className="flex justify-between items-end border-b-2 border-dashed border-slate-100 pb-4 mb-4 relative z-10">
                    <div className="transition-all duration-300">
                      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{isAnnual ? 'Annual Plan' : 'Monthly Plan'}</div>
                      <div className="text-slate-900 text-4xl font-serif-display font-medium mt-1.5 tracking-tight">
                        {isAnnual ? (
                          <>$390<span className="text-sm text-slate-400 font-sans-body font-normal tracking-normal">/year</span></>
                        ) : (
                          <>$39<span className="text-sm text-slate-400 font-sans-body font-normal tracking-normal">/mo</span></>
                        )}
                      </div>
                      <div className={`text-[10px] text-lime-600 font-medium mt-1 transition-all duration-300 ${isAnnual ? 'opacity-100 h-4' : 'opacity-0 h-0 overflow-hidden'}`}>
                        ~$32.50/mo &bull; Save $78
                      </div>
                    </div>
                    <div className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide transition-all duration-300 ${isAnnual ? 'bg-[#C3F53C] text-slate-900 border border-lime-400' : 'bg-lime-50 text-lime-700 border border-lime-200'}`}>
                      {isAnnual ? 'Best Value' : 'Active'}
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-5 relative z-10">
                    {[
                      "Custom design",
                      "Hosting + SSL",
                      "Domain connection",
                      "Mobile optimized",
                      "Google-friendly structure",
                      "Managed updates"
                    ].map((item, i) => (
                      <div key={i} className="flex justify-between text-xs group/item">
                        <span className="text-slate-600 font-medium group-hover/item:text-slate-900 transition-colors">{item}</span>
                        <Check size={14} className="text-[#C3F53C]" />
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Total Due Today</span>
                      <span className="text-slate-900 font-bold font-serif-display text-lg">$0.00</span>
                    </div>
                    <button
                      onClick={onCheckout}
                      disabled={isLoading}
                      className="w-full bg-[#C3F53C] text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-[#b4e62b] transition-all shadow-lg shadow-lime-300/30 hover:shadow-lime-300/40 hover:-translate-y-0.5 active:scale-95 flex justify-center items-center gap-2 group/btn disabled:opacity-50"
                    >
                      {isLoading ? 'Loading...' : 'Start My Build'}
                      <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-center text-[9px] text-slate-400 mt-3 font-medium">100% Money-back guarantee for 30 days.</p>
                  </div>
                </div>

                <div className="absolute -bottom-[1px] left-0 w-full h-5 z-10">
                  <svg className="w-full h-full text-[#F9FAFB]" preserveAspectRatio="none" viewBox="0 0 100 10">
                    <polygon points="0,0 2,10 4,0 6,10 8,0 10,10 12,0 14,10 16,0 18,10 20,0 22,10 24,0 26,10 28,0 30,10 32,0 34,10 36,0 38,10 40,0 42,10 44,0 46,10 48,0 50,10 52,0 54,10 56,0 58,10 60,0 62,10 64,0 66,10 68,0 70,10 72,0 74,10 76,0 78,10 80,0 82,10 84,0 86,10 88,0 90,10 92,0 94,10 96,0 98,10 100,0 100,10 0,10" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

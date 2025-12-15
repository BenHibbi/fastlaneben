'use client'

import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function ProcessSection() {
  const steps = [
    { step: "01", title: "Tell us about your business", desc: "2-minute form." },
    { step: "02", title: "Get your draft", desc: "Custom mockup in your inbox within 48h." },
    { step: "03", title: "Fine-tune", desc: "We adjust it until it feels right. → (2 rounds)" },
    { step: "04", title: "Go live", desc: "Your site launches. Customers see you." }
  ]

  return (
    <section id="how-it-works" className="py-24 md:py-32 lg:py-40 lime-mesh-bg relative z-10">
      {/* Top fade gradient */}
      <div className="absolute top-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-b from-white to-transparent pointer-events-none z-0"></div>
      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-0"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal>
          <div className="text-center mb-10 md:mb-16">
            <h2 className="font-serif-display text-2xl sm:text-3xl md:text-5xl text-slate-900 mb-4 md:mb-6">From idea to live within 7 days.</h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {steps.map((item, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div className="relative group">
                {i !== 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-slate-200 -z-10">
                    <div className="h-full bg-[#C3F53C] w-0 group-hover:w-full transition-all duration-700 ease-out delay-100"></div>
                  </div>
                )}

                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 shadow-md text-base sm:text-lg font-bold font-serif-display text-slate-900 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:border-[#C3F53C] border-2 border-transparent">
                  {item.step}
                </div>
                <h3 className="font-bold text-sm sm:text-base md:text-lg text-slate-900 mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-slate-500 text-xs sm:text-sm">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

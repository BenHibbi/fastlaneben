'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import Link from 'next/link'

const faqs = [
  {
    q: "What is Fastlane, exactly?",
    a: "Fastlane is a subscription-based website production and hosting service. We design, build, host, and maintain your website so you don't have to deal with agencies, freelancers, or technical complexity."
  },
  {
    q: "Do I have to pay before seeing anything?",
    a: "No. You first complete a short onboarding and receive a custom preview of your website. You only pay when you decide to activate and go live."
  },
  {
    q: "How long does it take?",
    a: "Once production starts, your website is delivered in 7 business days. The clock starts only after payment is completed AND all required content is provided."
  },
  {
    q: "What's included in the base plan?",
    a: "One website, one validated design direction, mobile-optimized layout, hosting & SSL, two revision rounds, and up to ten minor changes per revision round."
  },
  {
    q: "Do I own the website?",
    a: "You don't own the underlying code or structure. You receive a license to use the website as long as your subscription is active. This is the same model used by most modern website platforms."
  },
  {
    q: "What happens if I stop paying?",
    a: "If a payment fails or the subscription is canceled, your website may be taken offline and your license to use it ends. No surprises, no penalties — just a clean stop."
  },
  {
    q: "Can I get a refund?",
    a: "No. Once production has started, refunds are not available due to the nature of digital services. This policy allows us to offer low pricing and fast delivery."
  },
  {
    q: "Are results guaranteed?",
    a: "No. We don't guarantee traffic, rankings, conversions, or business results. We guarantee delivery, structure, and professionalism — not marketing outcomes."
  }
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-16 md:py-24 lime-mesh-bg relative z-10">
      {/* Top fade gradient */}
      <div className="absolute top-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-b from-[#fafafa] to-transparent pointer-events-none z-0"></div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal>
          <h2 className="font-serif-display text-2xl sm:text-3xl text-slate-900 mb-3 text-center">Frequently Asked Questions</h2>
          <p className="text-slate-500 text-center mb-8 md:mb-12">Everything you need to know about Fastlane</p>
        </ScrollReveal>
        <div className="space-y-3">
          {faqs.map((item, i) => (
            <ScrollReveal key={i} delay={i * 50}>
              <div
                className="bg-white/60 backdrop-blur-sm border border-white rounded-xl sm:rounded-2xl overflow-hidden transition-all hover:bg-white hover:shadow-lg"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full p-4 sm:p-6 flex items-center justify-between gap-4 text-left"
                >
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">{item.q}</h3>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-slate-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="px-4 sm:px-6 pb-4 sm:pb-6 text-slate-600 text-sm sm:text-base">
                    {item.a}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={400}>
          <div className="text-center mt-8">
            <Link
              href="/faq"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors underline underline-offset-4"
            >
              View all FAQs →
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

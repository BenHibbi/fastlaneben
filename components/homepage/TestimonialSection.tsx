'use client'

import { ScrollReveal } from '@/components/ui/ScrollReveal'

const testimonials = [
  {
    quote: "Got three new clients the first week. My old site was embarrassing — now people actually call.",
    name: "Marcus",
    role: "Electrician",
    initials: "MR"
  },
  {
    quote: "I was spending $200/mo on a site that looked worse than this. Fastlane just gets it.",
    name: "Sarah",
    role: "Salon Owner",
    initials: "SL"
  },
  {
    quote: "The 7-day turnaround is real. I thought it was marketing BS but they delivered.",
    name: "Jake",
    role: "Plumber",
    initials: "JK"
  },
  {
    quote: "Finally look as legit as the bigger shops. My Google reviews doubled in a month.",
    name: "Linda",
    role: "Bakery Owner",
    initials: "LM"
  },
  {
    quote: "Best $29 I spend each month. Period. Customers compliment my site all the time now.",
    name: "Tony",
    role: "Auto Detailer",
    initials: "TD"
  },
  {
    quote: "I'm not tech savvy at all. They handled everything. I just approved the design.",
    name: "Eva",
    role: "Dog Groomer",
    initials: "EV"
  }
]

export function TestimonialSection() {
  return (
    <section className="min-h-screen flex flex-col justify-center py-16 md:py-24 bg-[#fafafa] overflow-hidden relative z-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-10 md:mb-14">
        <ScrollReveal>
          <h2 className="font-serif-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-slate-900 leading-tight">
            Business owners are already<br />
            <span className="text-slate-400">winning with better websites.</span>
          </h2>
        </ScrollReveal>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-[#fafafa] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-[#fafafa] to-transparent z-10 pointer-events-none"></div>

        {/* Scrolling Cards */}
        <div className="flex w-[200%] animate-scroll hover:[animation-play-state:paused]">
          {[...Array(2)].map((_, setIndex) => (
            <div key={setIndex} className="flex gap-4 sm:gap-6 px-2 sm:px-3">
              {testimonials.map((testimonial, i) => (
                <div
                  key={`${setIndex}-${i}`}
                  className="flex-shrink-0 w-[280px] sm:w-[320px] bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <p className="text-slate-700 text-sm sm:text-[15px] leading-relaxed mb-5">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                      {testimonial.initials}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{testimonial.name}</div>
                      <div className="text-slate-400 text-xs">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import {
  ArrowDown,
  ChevronRight,
  Hammer,
  Phone,
  Star,
  Zap,
  Settings,
  Search,
  ArrowRight,
  Check
} from 'lucide-react'

interface HeroSectionProps {
  isLoading: boolean
  onCheckout: () => void
}

export function HeroSection({ isLoading, onCheckout }: HeroSectionProps) {
  return (
    <section className="fixed top-0 left-0 right-0 pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-28 lg:pb-24 overflow-hidden hero-mesh-bg z-0 min-h-screen">
      {/* Animated Background Blob */}
      <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-lime-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob -z-10 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-50/60 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 -z-10 -translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

        {/* Left: Copy */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10 lg:pl-8">
          {/* Headline */}
          <h1 className="animate-blur-fade delay-100 font-serif-display text-4xl sm:text-5xl lg:text-7xl leading-[1.1] font-medium text-slate-900 mb-4 sm:mb-6 tracking-tight">
            Your website. <br />
            <span className="text-slate-400">Live within 7 days.</span>
          </h1>

          {/* Subhead */}
          <p className="animate-blur-fade delay-200 font-sans-body text-base sm:text-lg text-slate-600 mb-8 sm:mb-10 max-w-lg leading-relaxed">
            From <span className="font-bold text-slate-900">$39/month</span>. Hosting included. $0 upfront. <br className="hidden md:block"/>
            The professional standard for local business.
          </p>

          {/* CTA Group */}
          <div className="animate-blur-fade delay-300 flex flex-col items-center lg:items-start gap-4 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button
                onClick={onCheckout}
                disabled={isLoading}
                className="group relative px-8 py-4 bg-[#C3F53C] text-slate-900 rounded-2xl font-bold transition-all duration-300 hover:bg-[#b4e62b] hover:shadow-xl hover:shadow-lime-300/30 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 overflow-hidden ring-1 ring-lime-400/50 disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? 'Loading...' : 'Start My Build'}
                  <ArrowDown size={18} className="group-hover:translate-y-1 transition-transform" />
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0"></div>
              </button>
              <button className="px-8 py-4 text-slate-600 font-medium hover:text-slate-900 transition-colors hover:bg-white/50 rounded-2xl active:scale-95 duration-200 border border-transparent hover:border-slate-200">
                View Examples
              </button>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase flex items-center gap-2 opacity-80">
              See your mockup before paying anything
            </p>
            <div className="mt-6 max-w-sm">
              <div className="p-4 bg-slate-900/5 rounded-xl border border-slate-200/50">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="font-semibold text-slate-900">Fastlane is not unlimited.</span><br />
                  We accept a maximum of <span className="font-bold text-slate-900">150 active clients</span><br />
                  to ensure quality, speed, and support.
                </p>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-900 uppercase tracking-wider">
                Take your seat.
              </p>
              {/* 150 dots: 12 green (taken), 1 blinking (next), 137 gray (available) */}
              <div className="mt-3 flex flex-wrap gap-[3px] max-w-xs">
                {Array.from({ length: 150 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      i < 12
                        ? 'bg-lime-500'
                        : i === 12
                        ? 'bg-lime-400 animate-pulse'
                        : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Right: Visual (CSS Phone) - Hidden on small mobile, scaled on tablet */}
        <div className="hidden sm:flex relative justify-center lg:justify-center mt-4 lg:mt-4 perspective-1000 animate-blur-fade delay-200 lg:-ml-8">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-lime-200/20 rounded-full blur-[100px] -z-10" />

          {/* The Phone Device */}
          <div className="relative w-[260px] h-[520px] md:w-[320px] md:h-[640px] bg-[#1a1a1a] rounded-[45px] md:rounded-[55px] border-[5px] md:border-[6px] border-[#3a3a3a] ring-1 ring-black/50 shadow-2xl shadow-lime-900/10 overflow-hidden transform rotate-y-12 rotate-z-2 hover:rotate-0 hover:scale-[1.01] transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ease-out z-10 group cursor-default">

            {/* Device Frame Details */}
            <div className="absolute inset-0 border-[2px] border-white/10 rounded-[48px] pointer-events-none z-50"></div>

            {/* Dynamic Island */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-3xl z-40 flex justify-center items-center gap-2 pointer-events-none shadow-md">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]/50"></div>
            </div>

            {/* Gloss Overlay */}
            <div className="absolute inset-0 phone-gloss z-40 opacity-60 group-hover:opacity-40 transition-opacity duration-700"></div>

            {/* Scrollable Screen Content */}
            <div className="w-full h-full bg-white overflow-y-auto no-scrollbar scroll-smooth relative z-10">
              <PhoneMockupContent />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PhoneMockupContent() {
  return (
    <>
      {/* --- MOCK SITE HEADER --- */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-5 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-[#0f172a] to-slate-700 text-[#C3F53C] p-1.5 rounded-lg shadow-md relative overflow-hidden">
            <Hammer size={11} fill="currentColor" className="relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
          <span className="text-[11px] font-serif-display font-bold text-slate-900 tracking-tight">Precision.</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-lime-50 rounded-full">
            <div className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse"></div>
            <span className="text-[7px] font-bold text-lime-700 uppercase">Online</span>
          </div>
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* --- MOCK SITE HERO --- */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-lime-50/30 px-5 pt-8 pb-10 relative overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-lime-200/60 rounded-full blur-2xl -mr-8 -mt-8 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-100/40 rounded-full blur-xl -ml-6 mb-4 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/80 backdrop-blur-sm text-slate-700 text-[7px] font-bold uppercase tracking-wider rounded-full mb-4 border border-slate-100 shadow-sm animate-float">
            <div className="w-1 h-1 bg-lime-500 rounded-full"></div>
            Licensed &amp; Insured
            <Check size={8} className="text-lime-600" />
          </div>

          <h2 className="font-serif-display text-[22px] text-slate-900 leading-[1.15] mb-3 tracking-tight">
            Master Plumbing<br/>
            <span className="text-slate-400">for Seattle.</span>
          </h2>

          <p className="text-[10px] text-slate-500 mb-6 leading-relaxed max-w-[90%]">
            24/7 emergency service. Upfront pricing. Real humans who care about your home.
          </p>

          {/* CTA buttons with micro-animations */}
          <div className="flex gap-2">
            <div className="flex-1 relative bg-[#0f172a] text-[#C3F53C] text-[9px] font-bold py-3 rounded-xl text-center shadow-lg shadow-slate-900/20 cursor-pointer overflow-hidden group/cta">
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                Book Now <Zap size={10} className="animate-pulse" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700"></div>
            </div>
            <div className="w-11 flex items-center justify-center border border-slate-200 rounded-xl bg-white shadow-sm cursor-pointer hover:bg-slate-50 hover:border-lime-300 transition-all relative">
              <Phone size={12} className="text-slate-600"/>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-lime-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOCK SITE STATS with animations --- */}
      <div className="grid grid-cols-3 border-b border-slate-100 divide-x divide-slate-100 bg-white relative">
        <div className="absolute inset-0 bg-gradient-to-r from-lime-50/0 via-lime-50/30 to-lime-50/0 animate-pulse opacity-50"></div>
        {[
          { value: "4.9", label: "Rating", icon: <Star size={8} className="text-amber-400" fill="currentColor" /> },
          { value: "24/7", label: "Available" },
          { value: "500+", label: "Jobs Done" }
        ].map((stat, i) => (
          <div key={i} className="p-3 text-center relative">
            <div className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
              {stat.value}
              {stat.icon}
            </div>
            <div className="text-[7px] text-slate-400 uppercase font-semibold tracking-wider mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* --- MOCK SITE SERVICES with staggered animations --- */}
      <div className="px-5 py-8 bg-white">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Services</h3>
          <div className="text-[8px] text-lime-600 font-medium flex items-center gap-1 cursor-pointer hover:gap-2 transition-all">
            View all <ChevronRight size={10} />
          </div>
        </div>
        <div className="space-y-3">
          {[
            { icon: <Zap size={12} />, title: "Emergency", sub: "< 2hr response", hot: true },
            { icon: <Settings size={12} />, title: "Installations", sub: "Water heaters" },
            { icon: <Search size={12} />, title: "Inspections", sub: "Camera included" }
          ].map((s, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] cursor-pointer group/service transition-all hover:shadow-md hover:-translate-y-0.5 ${s.hot ? 'border-lime-200 bg-lime-50/30' : 'border-slate-100 hover:border-lime-200'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${s.hot ? 'bg-lime-100 text-lime-700' : 'bg-slate-50 text-slate-600 group-hover/service:bg-lime-100 group-hover/service:text-lime-700'}`}>
                {s.icon}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-900 flex items-center gap-1.5">
                  {s.title}
                  {s.hot && <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[6px] font-bold rounded-full uppercase animate-pulse">Hot</span>}
                </div>
                <div className="text-[8px] text-slate-500">{s.sub}</div>
              </div>
              <ChevronRight size={12} className="text-slate-300 group-hover/service:text-lime-500 group-hover/service:translate-x-0.5 transition-all" />
            </div>
          ))}
        </div>
      </div>

      {/* --- MOCK SITE TESTIMONIAL with enhanced visuals --- */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#0f172a] to-slate-800 text-white px-5 py-8 relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/10 rounded-full -mr-16 -mt-16 blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-12 mb-0 blur-xl animate-blob"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-0.5 text-[#C3F53C]">
              {[1,2,3,4,5].map(i => <Star key={i} size={9} fill="currentColor" />)}
            </div>
            <span className="text-[7px] text-slate-400 uppercase tracking-wider">Verified Review</span>
          </div>

          <p className="font-serif-display text-[13px] italic leading-relaxed text-white/90 mb-5">
            &quot;Best plumber in Seattle. Period. Fast, clean, and exactly what they quoted.&quot;
          </p>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 ring-2 ring-white/20 flex items-center justify-center text-[10px] font-bold text-slate-900">
              SJ
            </div>
            <div>
              <div className="text-[9px] font-bold">Sarah Johnson</div>
              <div className="text-[7px] text-slate-400">Ballard, WA &bull; 2 days ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- SEXY MOCK SITE FOOTER --- */}
      <div className="bg-[#0a0a0a] px-5 pt-8 pb-16 relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-lime-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10">
          {/* CTA section */}
          <div className="bg-gradient-to-r from-[#C3F53C] to-lime-400 rounded-2xl p-4 mb-6 relative overflow-hidden shadow-lg shadow-lime-500/20">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgwLDAsMCwwLjA1KSIvPjwvc3ZnPg==')] opacity-50"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-900 mb-0.5">Ready to start?</div>
                <div className="text-[8px] text-slate-700">Free estimates &bull; No pressure</div>
              </div>
              <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-md">
                <ArrowRight size={12} className="text-[#C3F53C]" />
              </div>
            </div>
          </div>

          {/* Footer links */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-[8px]">
            <div className="space-y-2">
              <div className="text-slate-500 uppercase tracking-wider font-bold text-[7px] mb-2">Services</div>
              <div className="text-slate-400 hover:text-white cursor-pointer transition-colors">Repairs</div>
              <div className="text-slate-400 hover:text-white cursor-pointer transition-colors">Installation</div>
              <div className="text-slate-400 hover:text-white cursor-pointer transition-colors">Emergency</div>
            </div>
            <div className="space-y-2">
              <div className="text-slate-500 uppercase tracking-wider font-bold text-[7px] mb-2">Contact</div>
              <div className="text-slate-400 hover:text-white cursor-pointer transition-colors">Call us</div>
              <div className="text-slate-400 hover:text-white cursor-pointer transition-colors">Email</div>
              <div className="text-slate-400 hover:text-white cursor-pointer transition-colors">Location</div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gradient-to-br from-slate-700 to-slate-800 rounded-md flex items-center justify-center">
                  <Hammer size={8} className="text-[#C3F53C]" />
                </div>
                <span className="text-[8px] font-serif-display font-bold text-white">Precision.</span>
              </div>
              <div className="text-[7px] text-slate-500">&copy; 2026</div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-1">
              <span className="text-[7px] text-slate-600">Designed by</span>
              <span className="text-[7px] font-bold text-[#C3F53C]">Fastlane.</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

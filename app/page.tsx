'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import {
  Menu,
  X,
  Hammer,
  ArrowDown,
  ChevronRight,
  Check,
  Star,
  Phone,
  Clock,
  MapPin,
  ArrowRight,
  Zap,
  LayoutTemplate,
  Users,
  Smartphone,
  Search,
  Settings,
  ArrowUpRight
} from 'lucide-react'

/* --- Scroll Reveal Component for Micro-animations --- */
const ScrollReveal = ({ children, className = "", delay = 0 }: { children: ReactNode, className?: string, delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform ${
        isVisible
          ? "opacity-100 translate-y-0 filter-none"
          : "opacity-0 translate-y-12 blur-md"
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default function FastlaneHomepage() {
  const [scrolled, setScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnnual, setIsAnnual] = useState(false)
  const [showCookies, setShowCookies] = useState(true)

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle Stripe checkout
  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: 'New Customer', // You could add a form modal here
          email: '', // Stripe will collect this
          currency: 'USD'
        })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C3F53C] selection:text-slate-900 overflow-x-hidden">

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) border-b ${scrolled ? 'bg-white/80 backdrop-blur-xl border-slate-200 py-2.5 sm:py-3 shadow-sm' : 'bg-transparent border-transparent py-4 sm:py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 group cursor-pointer z-50">
            <span className="font-serif-display font-bold italic text-2xl tracking-tight text-slate-900 group-hover:text-lime-600 transition-colors duration-300">
              Fastlane.
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'How it Works', href: '#how-it-works' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Login', href: '/login' }
            ].map((item) => (
              <a key={item.label} href={item.href} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors relative group">
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#C3F53C] transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></span>
              </a>
            ))}
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="px-6 py-3 text-sm font-medium border border-slate-200 rounded-2xl text-slate-900 hover:border-[#C3F53C] hover:bg-[#C3F53C]/10 transition-all bg-white/50 backdrop-blur-sm active:scale-95 shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Get Started'}
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden text-slate-900 z-50" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl pt-20 sm:pt-28 px-4 sm:px-6 md:hidden animate-blur-fade duration-300">
          <div className="flex flex-col gap-6 sm:gap-8 text-xl sm:text-2xl font-serif-display">
            <a href="#how-it-works" className="border-b border-slate-100 pb-4 text-slate-900">How it Works</a>
            <a href="#pricing" className="border-b border-slate-100 pb-4 text-slate-900">Pricing</a>
            <a href="/login" className="border-b border-slate-100 pb-4 text-slate-900">Login</a>
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="bg-[#C3F53C] text-slate-900 py-4 rounded-2xl font-sans-body font-bold shadow-xl shadow-lime-300/20 active:scale-95 transition-transform disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Get Started'}
            </button>
          </div>
        </div>
      )}

      {/* Hero Section - Fixed */}
      <section className="fixed top-0 left-0 right-0 pt-20 pb-16 md:pt-24 md:pb-20 lg:pt-28 lg:pb-24 overflow-hidden hero-mesh-bg z-0 min-h-screen">
        {/* Animated Background Blob */}
        <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-lime-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob -z-10 translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-50/60 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 -z-10 -translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* Left: Copy */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left z-10 lg:pl-8">
            {/* Scarcity Pill */}
            <div className="animate-blur-fade flex items-center gap-4 mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full frosted-glass hover:shadow-md transition-shadow cursor-default group hover:-translate-y-0.5 duration-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500 shadow-[0_0_12px_rgba(195,245,60,0.6)]"></span>
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 group-hover:text-slate-900 transition-colors">
                    Batch #04 Open: <span className="text-slate-900">12/50 Spots Left</span>
                  </span>
                </div>
            </div>

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
                    onClick={handleCheckout}
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
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-2">
                  <Users size={12} className="text-lime-600" />
                  100+ local businesses already live
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
                          Licensed & Insured
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
                          <div className="text-[7px] text-slate-400">Ballard, WA • 2 days ago</div>
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
                           <div className="text-[8px] text-slate-700">Free estimates • No pressure</div>
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
                         <div className="text-[7px] text-slate-500">© 2026</div>
                       </div>
                       <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-1">
                         <span className="text-[7px] text-slate-600">Designed by</span>
                         <span className="text-[7px] font-bold text-[#C3F53C]">Fastlane.</span>
                       </div>
                     </div>
                   </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for fixed hero */}
      <div className="h-screen" />

      {/* Infinite Marquee */}
      <div className="bg-slate-900 py-2.5 sm:py-3.5 overflow-hidden relative z-20 border-y border-slate-800">
        <div className="flex w-[200%] animate-scroll hover:[animation-play-state:paused] cursor-default">
            {[...Array(12)].map((_, i) => (
            <div key={i} className="whitespace-nowrap flex items-center gap-4 sm:gap-8 mx-2 sm:mx-4">
                <span className="text-white/80 text-[10px] sm:text-xs font-bold font-sans-body tracking-wider sm:tracking-widest uppercase">
                    $39 / month • Ready in 7 days • Hosting + SSL included • Add-ons & Edits Available
                </span>
                <span className="text-[#C3F53C]">•</span>
            </div>
            ))}
        </div>
      </div>

      {/* Old Way vs New Way Section */}
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

      {/* Who It's For - Pain Points - Sticky Container */}
      <div className="relative z-10">
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

        {/* Features (No Fluff) */}
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
      </div>

      {/* Pricing Section */}
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
                                        ~$32.50/mo • Save $78
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
                                    onClick={handleCheckout}
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

      {/* Process Section */}
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
               {[
                 { step: "01", title: "Tell us about your business", desc: "2-minute form." },
                 { step: "02", title: "Get your draft", desc: "Custom mockup in your inbox within 48h." },
                 { step: "03", title: "Fine-tune", desc: "We adjust it until it feels right. → (2 rounds)" },
                 { step: "04", title: "Go live", desc: "Your site launches. Customers see you." }
               ].map((item, i) => (
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

      {/* Portfolio Section */}
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
                      <p className="text-xs text-slate-500">Local Business • Seattle, WA</p>
                    </div>
                  </ScrollReveal>
               ))}
            </div>
         </div>
      </section>

      {/* Testimonial Marquee Section */}
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
                {[
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
                ].map((testimonial, i) => (
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

      {/* FAQ Section */}
      <section className="py-16 md:py-24 lime-mesh-bg relative z-10">
        {/* Top fade gradient - grey to green */}
        <div className="absolute top-0 left-0 right-0 h-24 md:h-32 bg-gradient-to-b from-[#fafafa] to-transparent pointer-events-none z-0"></div>
         <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
            <ScrollReveal>
              <h2 className="font-serif-display text-2xl sm:text-3xl text-slate-900 mb-8 md:mb-12 text-center">FAQ (Short)</h2>
            </ScrollReveal>
            <div className="grid gap-3 sm:gap-4">
               {[
                  { q: "Do I own the domain?", a: "Yes. We register it in your name." },
                  { q: "What happens if I stop paying?", a: "The site goes offline, but you keep the domain." },
                  { q: "Why is it so affordable?", a: "No offices. No meetings. We use our own tech to build faster." }
               ].map((item, i) => (
                  <ScrollReveal key={i} delay={i * 100}>
                    <div className="bg-white/60 backdrop-blur-sm border border-white rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all hover:bg-white hover:shadow-lg hover:-translate-y-1">
                      <div className="flex flex-col md:flex-row md:items-baseline gap-1 sm:gap-2 md:gap-8">
                        <h3 className="font-bold text-slate-900 w-full md:w-1/2 text-base sm:text-lg">{item.q}</h3>
                        <p className="text-slate-600 w-full md:w-1/2 text-sm sm:text-base">{item.a}</p>
                      </div>
                    </div>
                  </ScrollReveal>
               ))}
            </div>
         </div>
      </section>

      {/* Final CTA */}
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
                  onClick={handleCheckout}
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

      {/* Status Bar */}
      <div className="bg-[#1a1a1a] border-t border-white/10 py-3 sm:py-4 relative z-10">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-center md:justify-between items-center gap-2 sm:gap-4 text-[8px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] font-medium text-slate-400">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#C3F53C] animate-pulse"></div>
               STATUS: Accepting projects
            </div>
            <div className="hidden sm:block">TURNAROUND: 7 days</div>
            <div className="hidden sm:block">AVAILABILITY: Limited slots</div>
         </div>
      </div>

      {/* Footer */}
      <footer className="relative bg-[#C3F53C] text-slate-900 pt-12 sm:pt-16 md:pt-24 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16 md:mb-24">
                <div className="pt-4 md:pt-8">
                    <div className="grid grid-cols-2 gap-4 sm:gap-8 text-sm font-medium">
                        <div className="flex flex-col gap-3 sm:gap-4">
                            <a href="#how-it-works" className="hover:underline decoration-2 underline-offset-4">How it works</a>
                            <a href="#pricing" className="hover:underline decoration-2 underline-offset-4">Pricing</a>
                            <a href="#" className="hover:underline decoration-2 underline-offset-4">Showcase</a>
                        </div>
                        <div className="flex flex-col gap-3 sm:gap-4">
                            <a href="/login" className="hover:underline decoration-2 underline-offset-4">Login</a>
                            <a href="#" className="hover:underline decoration-2 underline-offset-4">Support</a>
                            <a href="#" className="hover:underline decoration-2 underline-offset-4">Terms</a>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-between">
                    <div className="bg-slate-900 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl text-white shadow-2xl shadow-slate-900/10 transform sm:rotate-1 hover:rotate-0 transition-transform duration-500">
                        <h4 className="font-serif-display text-xl sm:text-2xl mb-3 sm:mb-4">Join the waitlist.</h4>
                        <p className="text-slate-400 text-xs sm:text-sm mb-4 sm:mb-6">Get early access to new batches.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="email@company.com"
                                className="bg-white/10 border-transparent text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-[#C3F53C]"
                            />
                            <button className="bg-white text-slate-900 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-slate-200 transition-colors">
                                →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-900/10 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-2 pb-6 sm:pb-8">
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-50">
                    © 2026 Fastlane Inc.
                </div>
                <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-50 text-right">
                    Alberta • Wyoming • Réunion
                </div>
            </div>
        </div>

        <div className="w-full text-center leading-none relative">
            <h1 className="font-serif-display font-black italic text-[15vw] sm:text-[18vw] text-slate-900 tracking-tighter leading-[0.75] select-none speed-lines">
                FASTLANE
                <span className="speed-line-extra speed-line-extra-1"></span>
                <span className="speed-line-extra speed-line-extra-2"></span>
                <span className="speed-line-extra speed-line-extra-3"></span>
                <span className="speed-line-extra-4"></span>
                <span className="speed-line-extra-5"></span>
                <span className="speed-line-extra-6"></span>
            </h1>
        </div>
      </footer>

      {/* Cookie Consent Popup */}
      {showCookies && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-blur-fade">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 max-w-[320px] flex items-center gap-4">
            <p className="text-slate-400 text-[13px] leading-relaxed">
              We use cookies to run ads, and analyze traffic.
            </p>
            <button
              onClick={() => setShowCookies(false)}
              className="shrink-0 px-4 py-1.5 border border-slate-200 text-slate-400 text-sm rounded-lg hover:border-slate-300 hover:text-slate-500 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

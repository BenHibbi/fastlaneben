'use client'

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/homepage/Navigation'
import { MobileMenu } from '@/components/homepage/MobileMenu'
import { HeroSection } from '@/components/homepage/HeroSection'
import { MarqueeBanner } from '@/components/homepage/MarqueeBanner'
import { ComparisonSection } from '@/components/homepage/ComparisonSection'
import { PainPointSection } from '@/components/homepage/PainPointSection'
import { FeaturesSection } from '@/components/homepage/FeaturesSection'
import { PricingSection } from '@/components/homepage/PricingSection'
import { ProcessSection } from '@/components/homepage/ProcessSection'
import { PortfolioSection } from '@/components/homepage/PortfolioSection'
import { TestimonialSection } from '@/components/homepage/TestimonialSection'
import { FAQSection } from '@/components/homepage/FAQSection'
import { FinalCTASection } from '@/components/homepage/FinalCTASection'
import { StatusBar } from '@/components/homepage/StatusBar'
import { Footer } from '@/components/homepage/Footer'
import { CookieBanner } from '@/components/homepage/CookieBanner'

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

  // Handle "Start My Build" - redirect to signup flow
  const handleCheckout = () => {
    // Redirect to signup page, which will then redirect to client intake after auth
    window.location.href = '/signup?next=/client'
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#C3F53C] selection:text-slate-900 overflow-x-hidden">
      <Navigation
        scrolled={scrolled}
        isLoading={isLoading}
        onCheckout={handleCheckout}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />

      <MobileMenu
        isOpen={isMenuOpen}
        isLoading={isLoading}
        onCheckout={handleCheckout}
      />

      <HeroSection
        isLoading={isLoading}
        onCheckout={handleCheckout}
      />

      {/* Spacer for fixed hero */}
      <div className="h-screen" />

      <MarqueeBanner />

      <ComparisonSection />

      {/* Who It's For - Pain Points - Sticky Container */}
      <div className="relative z-10">
        <PainPointSection />
        <FeaturesSection />
      </div>

      <PricingSection
        isAnnual={isAnnual}
        setIsAnnual={setIsAnnual}
        isLoading={isLoading}
        onCheckout={handleCheckout}
      />

      <ProcessSection />

      <PortfolioSection />

      <TestimonialSection />

      <FAQSection />

      <FinalCTASection
        isLoading={isLoading}
        onCheckout={handleCheckout}
      />

      <StatusBar />

      <Footer />

      <CookieBanner
        show={showCookies}
        onClose={() => setShowCookies(false)}
      />
    </div>
  )
}

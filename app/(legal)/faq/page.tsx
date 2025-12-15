'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqCategories = [
  {
    title: "Getting Started",
    faqs: [
      {
        q: "What is Fastlane, exactly?",
        a: "Fastlane is a subscription-based website production and hosting service. We design, build, host, and maintain your website so you don't have to deal with agencies, freelancers, or technical complexity. It's a productized service, not a traditional agency."
      },
      {
        q: "Do I have to pay before seeing anything?",
        a: "No. You first complete a short onboarding and receive a custom preview of your website. You only pay when you decide to activate and go live. No preview, no payment."
      },
      {
        q: "How long does it take?",
        a: "Once production starts, your website is delivered in 7 business days. The clock starts only after payment is completed AND all required content is provided."
      },
      {
        q: "Is Fastlane right for me?",
        a: "Fastlane is perfect if you want a professional website, fast delivery, clear predictable pricing, and zero technical headaches. Fastlane is NOT a fit if you want unlimited revisions, ongoing creative collaboration, or custom-built complex systems."
      }
    ]
  },
  {
    title: "What's Included",
    faqs: [
      {
        q: "What's included in the base plan?",
        a: "The Fastlane base plan includes: one website, one validated design direction, mobile-optimized layout, hosting & SSL, two revision rounds, and up to ten minor changes per revision round."
      },
      {
        q: "What counts as a \"minor change\"?",
        a: "Minor changes include: editing text, replacing images, adjusting colors, reordering sections, and small visual tweaks."
      },
      {
        q: "What is NOT included?",
        a: "The following are NOT included: additional pages, new features or systems, complete redesigns, major direction changes, custom integrations, content writing or copywriting, and legal document drafting (privacy policies, terms, etc.)."
      }
    ]
  },
  {
    title: "Production & Delivery",
    faqs: [
      {
        q: "What happens if I don't reply to feedback requests?",
        a: "If we don't receive feedback within 5 business days, the design is considered approved by default, and we proceed to delivery. This keeps production fast and fair for everyone."
      },
      {
        q: "Can I ask for changes after the site is live?",
        a: "Yes. After delivery, simple changes cost $10 per request. Requests are submitted through the chatbot. Payment is required before execution."
      },
      {
        q: "What is considered a \"simple change\" after delivery?",
        a: "Examples: changing a sentence, replacing an image, updating a phone number, modifying a button label. Anything more complex may require a separate quote or module."
      }
    ]
  },
  {
    title: "Ownership & License",
    faqs: [
      {
        q: "Do I own the website?",
        a: "You don't own the underlying code or structure. You receive a license to use the website as long as your subscription is active. This is the same model used by most modern website platforms."
      },
      {
        q: "What happens if I stop paying?",
        a: "If a payment fails or the subscription is canceled: your website may be taken offline, your license to use it ends. No surprises, no penalties — just a clean stop."
      }
    ]
  },
  {
    title: "Content & Compliance",
    faqs: [
      {
        q: "Who is responsible for the content on my website?",
        a: "You are. You are solely responsible for all content displayed on your website, including text, images, logos, legal notices, privacy policies, terms, claims, and disclosures. We publish what you provide — we don't verify or audit your content."
      },
      {
        q: "Does Fastlane provide legal advice or compliance help?",
        a: "No. We do not provide legal, regulatory, tax, or compliance advice. We don't verify that your content meets legal requirements. If you need legal documents, consult a qualified attorney."
      },
      {
        q: "What if I'm in a regulated industry?",
        a: "Fastlane websites are general-purpose digital platforms. We don't guarantee compliance with industry-specific regulations (healthcare, finance, real estate, legal services, etc.). If you operate in a regulated industry, you are responsible for ensuring your website complies with all applicable laws."
      }
    ]
  },
  {
    title: "Guarantees & Results",
    faqs: [
      {
        q: "Are results guaranteed?",
        a: "No. We don't guarantee traffic, rankings, conversions, or business results. We guarantee delivery, structure, and professionalism — not marketing outcomes."
      },
      {
        q: "What about SEO?",
        a: "We build websites following best practices for structure and performance. However, we make no guarantees regarding search engine rankings, traffic volume, or lead generation. Any references to optimization are for general guidance only."
      }
    ]
  },
  {
    title: "Modules & Support",
    faqs: [
      {
        q: "How do feature modules work?",
        a: "Feature modules (chatbot, booking system, etc.) can be activated after your site is live. Modules are billed separately, they can be activated or deactivated anytime, and non-payment disables the module only, not your site."
      },
      {
        q: "Is there customer support?",
        a: "Yes — support is provided through an automated chatbot. The chatbot answers questions, classifies requests, and handles pricing for changes. This keeps Fastlane fast and affordable."
      }
    ]
  },
  {
    title: "Refunds & Cancellation",
    faqs: [
      {
        q: "Can I get a refund?",
        a: "No. Once production has started, refunds are not available due to the nature of digital services. This policy allows us to offer low pricing and fast delivery."
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes. You can cancel your subscription at any time. Upon cancellation, your website may be taken offline and your license ends. No refund will be provided for any unused portion."
      }
    ]
  },
  {
    title: "Legal & Disputes",
    faqs: [
      {
        q: "What happens if there's a dispute?",
        a: "Any disputes are resolved through binding arbitration administered by the American Arbitration Association. You agree to resolve disputes individually and waive the right to participate in class actions."
      },
      {
        q: "What law governs our agreement?",
        a: "The Terms of Service are governed by the laws of the State of Wyoming, United States."
      }
    ]
  }
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between gap-4 text-left"
      >
        <h3 className="font-medium text-slate-900">{q}</h3>
        <ChevronDown
          size={20}
          className={`shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-slate-600">{a}</p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <div>
      <h1 className="font-serif-display text-4xl text-slate-900 mb-2">Frequently Asked Questions</h1>
      <p className="text-slate-500 mb-12">Everything you need to know about Fastlane website services</p>

      <div className="space-y-12">
        {faqCategories.map((category, i) => (
          <section key={i}>
            <h2 className="font-serif-display text-xl text-slate-900 mb-4 pb-2 border-b border-slate-200">
              {category.title}
            </h2>
            <div>
              {category.faqs.map((faq, j) => (
                <FAQItem key={j} q={faq.q} a={faq.a} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center">
        <h3 className="font-serif-display text-xl text-slate-900 mb-2">Company Information</h3>
        <p className="text-slate-600 mb-4">Fastlane is operated by:</p>
        <address className="not-italic text-slate-600">
          <strong className="text-slate-900">CRUSH DIGITAL ATELIER LLC</strong><br />
          30 N GOULD ST STE N<br />
          Sheridan, WY 82801<br />
          United States<br />
          Email: <a href="mailto:eric@crushhh.co" className="text-lime-600 hover:underline">eric@crushhh.co</a>
        </address>
        <p className="mt-4 text-sm text-slate-500">
          For complete legal terms, please review our <a href="/terms" className="underline hover:text-slate-900">Terms of Service</a> and <a href="/privacy" className="underline hover:text-slate-900">Privacy Policy</a>.
        </p>
      </div>
    </div>
  )
}

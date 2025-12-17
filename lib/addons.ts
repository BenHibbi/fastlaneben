// Shared add-ons configuration (used by both client and server)

export interface AddOn {
  id: string
  emoji: string
  name: string
  description: string
  price: number
  features: string[]
  limitations?: string[]
  warning?: string
}

export interface AddOnTier {
  tier: string
  tierEmoji: string
  items: AddOn[]
}

export const ADD_ONS: AddOnTier[] = [
  {
    tier: 'ADD-ONS',
    tierEmoji: '🥇',
    items: [
      {
        id: 'online-booking',
        emoji: '🗓️',
        name: 'Online Booking',
        description: 'Let customers book without calling',
        price: 15,
        features: ['Calendly / Acuity / Tidycal', 'No payments handled', 'No custom logic']
      },
      {
        id: 'local-seo',
        emoji: '📍',
        name: 'Local SEO Boost',
        description: 'Improve your visibility on Google Maps',
        price: 15,
        features: ['Google Business Profile optimization', 'Local schema + map embed', 'NAP consistency']
      },
      {
        id: 'click-to-call',
        emoji: '📞',
        name: 'Click-to-Call Boost',
        description: 'Turn visits into phone calls',
        price: 5,
        features: ['Sticky call button', 'Mobile-first UX', 'Simple tracking (no call center)']
      }
    ]
  },
  {
    tier: 'BUSINESS',
    tierEmoji: '🥈',
    items: [
      {
        id: 'image-upgrade',
        emoji: '🖼️',
        name: 'Premium Image Pack',
        description: 'Professional stock photos for your site',
        price: 10,
        features: ['10 HD stock photos', 'Licensed for commercial use', 'Curated for your industry']
      },
      {
        id: 'trust-pack',
        emoji: '⭐',
        name: 'Trust Pack',
        description: 'Build credibility with social proof',
        price: 5,
        features: ['Google Reviews embed', 'Testimonial section', 'Trust badges']
      },
      {
        id: 'lead-capture',
        emoji: '📧',
        name: 'Lead Capture Form',
        description: 'Collect leads with a custom form',
        price: 5,
        features: ['Email notifications', 'Form validation', 'Spam protection']
      }
    ]
  },
  {
    tier: 'ENTERPRISE',
    tierEmoji: '🥉',
    items: [
      {
        id: 'extra-page',
        emoji: '📄',
        name: 'Extra Page',
        description: 'Add another page to your site',
        price: 15,
        features: ['1 additional page', 'Same design system', 'Full customization'],
        limitations: ['Max 3 extra pages total']
      },
      {
        id: 'multilingual',
        emoji: '🌍',
        name: 'Multilingual Support',
        description: 'Reach customers in their language',
        price: 20,
        features: ['2 languages included', 'Language switcher', 'SEO for each language'],
        limitations: ['Max 3 languages total']
      },
      {
        id: 'ai-assistant',
        emoji: '🤖',
        name: 'AI Chat Assistant',
        description: 'Answer customer questions 24/7',
        price: 29,
        features: ['Trained on your business', 'Lead capture', 'FAQ automation'],
        warning: 'Requires business info'
      }
    ]
  }
]

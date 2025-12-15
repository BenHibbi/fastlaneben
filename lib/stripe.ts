import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not defined')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}

// For backward compatibility
export const stripe = {
  get checkout() {
    return getStripe().checkout
  },
  get subscriptions() {
    return getStripe().subscriptions
  },
  get customers() {
    return getStripe().customers
  },
  get webhooks() {
    return getStripe().webhooks
  },
}

// Price IDs for different currencies - lazy access
export const PRICES = {
  get USD() { return process.env.STRIPE_PRICE_ID_USD! },
  get CAD() { return process.env.STRIPE_PRICE_ID_CAD! },
  get EUR() { return process.env.STRIPE_PRICE_ID_EUR! },
} as const

export type Currency = 'USD' | 'CAD' | 'EUR'

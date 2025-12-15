import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PRICES, Currency } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, email, currency = 'USD' } = body

    // Validate required fields
    if (!businessName || !email) {
      return NextResponse.json(
        { error: 'Business name and email are required' },
        { status: 400 }
      )
    }

    // Get the correct price ID for the currency
    const priceId = PRICES[currency as Currency] || PRICES.USD

    // Create Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        businessName,
        email,
        currency,
      },
      subscription_data: {
        metadata: {
          businessName,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://crushhh.co'}/webdesign/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://crushhh.co'}/webdesign`,
      // Automatic tax calculation (requires Stripe Tax to be enabled)
      automatic_tax: {
        enabled: true,
      },
      // Collect billing address for tax purposes
      billing_address_collection: 'required',
      // Allow promotion codes
      allow_promotion_codes: true,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

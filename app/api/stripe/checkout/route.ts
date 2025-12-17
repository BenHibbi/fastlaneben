import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PRICES, Currency } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkoutSchema, validateRequest } from '@/lib/validation'
import { createLogger } from '@/lib/logger'
import type { Client } from '@/types/database'

const checkoutLogger = createLogger('stripe-checkout')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateRequest(checkoutSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { clientId } = validation.data
    const currency = (body.currency as Currency) || 'USD'

    // Get client from database
    const supabase = createAdminClient()
    const { data, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError || !data) {
      checkoutLogger.warn('Client not found', { clientId })
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const client = data as Client

    // Verify client is in PREVIEW_READY or ACTIVATION state
    if (!['PREVIEW_READY', 'ACTIVATION'].includes(client.state)) {
      return NextResponse.json(
        { error: 'Client is not ready for checkout' },
        { status: 400 }
      )
    }

    // Verify terms have been accepted
    if (!client.terms_accepted_at) {
      return NextResponse.json(
        { error: 'Terms of Service must be accepted before checkout' },
        { status: 400 }
      )
    }

    // Get the correct price ID for the currency
    const priceId = PRICES[currency] || PRICES.USD

    // Create or get Stripe customer
    let customerId = client.stripe_customer_id

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: client.email,
        name: client.business_name || undefined,
        metadata: {
          client_id: client.id,
          business_name: client.business_name || ''
        }
      })
      customerId = customer.id

      // Save customer ID to database
      await supabase
        .from('clients')
        .update({ stripe_customer_id: customerId } as never)
        .eq('id', client.id)
    }

    // Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      metadata: {
        client_id: client.id,
        business_name: client.business_name || ''
      },
      subscription_data: {
        metadata: {
          client_id: client.id,
          business_name: client.business_name || ''
        }
      },
      success_url: `${baseUrl}/client?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/client`,
      automatic_tax: {
        enabled: true
      },
      billing_address_collection: 'required',
      allow_promotion_codes: true
    })

    checkoutLogger.info('Checkout session created', {
      clientId,
      sessionId: session.id
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    checkoutLogger.error('Stripe checkout error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import Stripe from 'stripe'

// Disable body parsing, we need raw body for webhook verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log('=== NEW SUBSCRIPTION ===')
      console.log('Customer Email:', session.customer_email)
      console.log('Business Name:', session.metadata?.businessName)
      console.log('Subscription ID:', session.subscription)
      console.log('Customer ID:', session.customer)

      // TODO: Add to your database, send welcome email, etc.
      // await createCustomerRecord(session)
      // await sendWelcomeEmail(session.customer_email, session.metadata?.businessName)
      break
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription created:', subscription.id)
      console.log('Status:', subscription.status)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription updated:', subscription.id)
      console.log('New status:', subscription.status)

      // Handle status changes (active, past_due, canceled, etc.)
      if (subscription.status === 'past_due') {
        // TODO: Send payment failed email
        console.log('Payment past due for subscription:', subscription.id)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      console.log('Subscription canceled:', subscription.id)

      // TODO: Deactivate customer's website
      // await deactivateWebsite(subscription.metadata?.businessName)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      console.log('Payment succeeded for invoice:', invoice.id)
      console.log('Amount paid:', invoice.amount_paid / 100, invoice.currency.toUpperCase())
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.log('Payment failed for invoice:', invoice.id)
      console.log('Customer:', invoice.customer_email)

      // TODO: Send payment failed notification
      // await sendPaymentFailedEmail(invoice.customer_email)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

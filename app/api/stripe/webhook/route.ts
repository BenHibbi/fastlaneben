import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

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

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const clientId = session.metadata?.client_id

      console.log('=== CHECKOUT COMPLETED ===')
      console.log('Client ID:', clientId)
      console.log('Customer Email:', session.customer_email)
      console.log('Subscription ID:', session.subscription)

      if (clientId) {
        // Get current client state
        const { data } = await supabase
          .from('clients')
          .select('state')
          .eq('id', clientId)
          .single()

        const client = data as { state: string } | null
        // Accept both PREVIEW_READY and ACTIVATION states for checkout completion
        if (client && ['PREVIEW_READY', 'ACTIVATION'].includes(client.state)) {
          const previousState = client.state
          // Update client with subscription info and transition to FINAL_ONBOARDING
          const { error: updateError } = await supabase
            .from('clients')
            .update({
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
              state: 'FINAL_ONBOARDING',
              state_changed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as never)
            .eq('id', clientId)

          if (!updateError) {
            // Log state transition
            await supabase.from('state_transitions').insert({
              client_id: clientId,
              from_state: previousState,
              to_state: 'FINAL_ONBOARDING',
              trigger_type: 'WEBHOOK',
              metadata: {
                action: 'payment_completed',
                subscription_id: session.subscription,
                checkout_session_id: session.id
              }
            } as never)
          }
        }
      }
      break
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      const clientId = subscription.metadata?.client_id

      console.log('Subscription created:', subscription.id)
      console.log('Status:', subscription.status)

      if (clientId) {
        await supabase
          .from('clients')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            updated_at: new Date().toISOString()
          } as never)
          .eq('id', clientId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const clientId = subscription.metadata?.client_id

      console.log('Subscription updated:', subscription.id)
      console.log('New status:', subscription.status)

      if (clientId) {
        await supabase
          .from('clients')
          .update({
            subscription_status: subscription.status,
            updated_at: new Date().toISOString()
          } as never)
          .eq('id', clientId)

        if (subscription.status === 'past_due') {
          console.log('Payment past due for client:', clientId)
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const clientId = subscription.metadata?.client_id

      console.log('Subscription canceled:', subscription.id)

      if (clientId) {
        await supabase
          .from('clients')
          .update({
            subscription_status: 'canceled',
            updated_at: new Date().toISOString()
          } as never)
          .eq('id', clientId)

        await supabase.from('state_transitions').insert({
          client_id: clientId,
          from_state: null,
          to_state: 'SUPPORT',
          trigger_type: 'WEBHOOK',
          metadata: {
            action: 'subscription_canceled',
            subscription_id: subscription.id
          }
        } as never)
      }
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
      const subscriptionId = invoice.subscription as string

      console.log('Payment failed for invoice:', invoice.id)
      console.log('Customer:', invoice.customer_email)

      if (subscriptionId) {
        const { data } = await supabase
          .from('clients')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        const client = data as { id: string } | null
        if (client) {
          await supabase
            .from('clients')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString()
            } as never)
            .eq('id', client.id)
        }
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

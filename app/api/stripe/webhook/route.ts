import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaymentConfirmedEmail } from '@/lib/email'
import { webhookLogger } from '@/lib/logger'
import type Stripe from 'stripe'
import type { ClientState, ClientUpdate } from '@/types/database'

export const runtime = 'nodejs'

// Type-safe update object builder
function buildClientUpdate(fields: Partial<ClientUpdate>): ClientUpdate {
  return {
    ...fields,
    updated_at: new Date().toISOString()
  }
}

// Check if webhook event was already processed (idempotency)
async function isEventProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .single()

  return !!data
}

// Mark event as processed
async function markEventProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
  eventType: string,
  payload?: object
): Promise<void> {
  await supabase.from('webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    payload: payload ?? null
  } as never)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    webhookLogger.warn('Webhook received without signature')
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
    webhookLogger.error('Webhook signature verification failed', {
      error: err instanceof Error ? err.message : String(err)
    })
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Idempotency check - prevent duplicate processing
  if (await isEventProcessed(supabase, event.id)) {
    webhookLogger.info('Duplicate webhook event ignored', {
      eventId: event.id,
      eventType: event.type
    })
    return NextResponse.json({ received: true, duplicate: true })
  }

  webhookLogger.info('Processing webhook event', {
    eventId: event.id,
    eventType: event.type
  })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clientId = session.metadata?.client_id

        webhookLogger.info('Checkout completed', {
          clientId,
          customerEmail: session.customer_email,
          subscriptionId: session.subscription
        })

        if (clientId) {
          const { data } = await supabase
            .from('clients')
            .select('state, email, business_name')
            .eq('id', clientId)
            .single()

          const client = data as {
            state: ClientState
            email: string
            business_name: string | null
          } | null

          if (client && ['PREVIEW_READY', 'ACTIVATION'].includes(client.state)) {
            const previousState = client.state

            const { error: updateError } = await supabase
              .from('clients')
              .update(
                buildClientUpdate({
                  stripe_subscription_id: session.subscription as string,
                  subscription_status: 'active',
                  state: 'FINAL_ONBOARDING',
                  state_changed_at: new Date().toISOString()
                }) as never
              )
              .eq('id', clientId)

            if (!updateError) {
              await supabase.from('state_transitions').insert({
                client_id: clientId,
                from_state: previousState,
                to_state: 'FINAL_ONBOARDING' as ClientState,
                trigger_type: 'WEBHOOK',
                metadata: {
                  action: 'payment_completed',
                  subscription_id: session.subscription,
                  checkout_session_id: session.id
                }
              } as never)

              await sendPaymentConfirmedEmail(
                client.email,
                client.business_name || 'your business'
              )

              webhookLogger.info('Client transitioned to FINAL_ONBOARDING', {
                clientId,
                fromState: previousState
              })
            } else {
              webhookLogger.error('Failed to update client after checkout', {
                clientId,
                error: updateError.message
              })
            }
          }
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const clientId = subscription.metadata?.client_id

        webhookLogger.info('Subscription created', {
          subscriptionId: subscription.id,
          status: subscription.status,
          clientId
        })

        if (clientId) {
          await supabase
            .from('clients')
            .update(
              buildClientUpdate({
                stripe_subscription_id: subscription.id,
                subscription_status: subscription.status
              }) as never
            )
            .eq('id', clientId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const clientId = subscription.metadata?.client_id

        webhookLogger.info('Subscription updated', {
          subscriptionId: subscription.id,
          status: subscription.status,
          clientId
        })

        if (clientId) {
          await supabase
            .from('clients')
            .update(
              buildClientUpdate({
                subscription_status: subscription.status
              }) as never
            )
            .eq('id', clientId)

          if (subscription.status === 'past_due') {
            webhookLogger.warn('Subscription past due', { clientId })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const clientId = subscription.metadata?.client_id

        webhookLogger.info('Subscription canceled', {
          subscriptionId: subscription.id,
          clientId
        })

        if (clientId) {
          await supabase
            .from('clients')
            .update(
              buildClientUpdate({
                subscription_status: 'canceled'
              }) as never
            )
            .eq('id', clientId)

          await supabase.from('state_transitions').insert({
            client_id: clientId,
            from_state: null,
            to_state: 'SUPPORT' as ClientState,
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
        webhookLogger.info('Payment succeeded', {
          invoiceId: invoice.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase()
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string

        webhookLogger.warn('Payment failed', {
          invoiceId: invoice.id,
          customerEmail: invoice.customer_email,
          subscriptionId
        })

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
              .update(
                buildClientUpdate({
                  subscription_status: 'past_due'
                }) as never
              )
              .eq('id', client.id)
          }
        }
        break
      }

      default:
        webhookLogger.debug('Unhandled event type', { eventType: event.type })
    }

    // Mark event as processed for idempotency
    await markEventProcessed(supabase, event.id, event.type)

    return NextResponse.json({ received: true })
  } catch (error) {
    webhookLogger.error('Webhook processing failed', {
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

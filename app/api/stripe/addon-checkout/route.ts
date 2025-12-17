import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ADD_ONS } from '@/lib/addons'

// Placeholder mapping for Stripe price IDs - to be configured in env
const ADDON_PRICE_MAP: Record<string, string | undefined> = {
  'online-booking': process.env.STRIPE_PRICE_ONLINE_BOOKING,
  'local-seo': process.env.STRIPE_PRICE_LOCAL_SEO,
  'click-to-call': process.env.STRIPE_PRICE_CLICK_TO_CALL,
  'image-upgrade': process.env.STRIPE_PRICE_IMAGE_UPGRADE,
  'trust-pack': process.env.STRIPE_PRICE_TRUST_PACK,
  'lead-capture': process.env.STRIPE_PRICE_LEAD_CAPTURE,
  'extra-page': process.env.STRIPE_PRICE_EXTRA_PAGE,
  'multilingual': process.env.STRIPE_PRICE_MULTILINGUAL,
  'ai-assistant': process.env.STRIPE_PRICE_AI_ASSISTANT
}

export async function POST(req: Request) {
  try {
    const { clientId, addons, pendingRevisions } = await req.json()

    if (!clientId || !addons || addons.length === 0) {
      return NextResponse.json({ error: 'Client ID and add-ons are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the user is authenticated
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, user_id, email, stripe_subscription_id, addons_terms_accepted_at, business_name')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const clientData = client as {
      id: string
      user_id: string | null
      email: string
      stripe_subscription_id: string | null
      addons_terms_accepted_at: string | null
      business_name: string | null
    }

    // Verify ownership
    if (clientData.user_id !== user.id && clientData.email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check terms acceptance
    if (!clientData.addons_terms_accepted_at) {
      return NextResponse.json({ error: 'Terms must be accepted first' }, { status: 400 })
    }

    // Get add-on details
    const allAddons = ADD_ONS.flatMap(tier => tier.items)
    const selectedAddons = allAddons.filter(addon => addons.includes(addon.id))

    if (selectedAddons.length === 0) {
      return NextResponse.json({ error: 'No valid add-ons selected' }, { status: 400 })
    }

    // Calculate total
    const totalMonthly = selectedAddons.reduce((sum, addon) => sum + addon.price, 0)

    // TODO: Implement Stripe checkout when ready
    // For now, return a placeholder response that skips actual payment
    // This allows testing the UI flow without Stripe integration

    // Check if Stripe prices are configured
    const missingPrices = selectedAddons.filter(addon => !ADDON_PRICE_MAP[addon.id])
    if (missingPrices.length > 0) {
      console.log('Stripe prices not configured for:', missingPrices.map(a => a.id))

      // Store pending revisions and add-ons for later processing
      // In production, this would be done via Stripe webhook after payment
      if (pendingRevisions && pendingRevisions.length > 0) {
        // Store in metadata or temp table - for now just log
        console.log('Pending revisions to process:', pendingRevisions)
      }

      // Return without URL to trigger placeholder behavior
      return NextResponse.json({
        success: true,
        message: 'Stripe not configured - proceeding without payment',
        addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
        totalMonthly
        // No URL means the client will proceed without redirect
      })
    }

    // When Stripe is configured, create checkout session here
    // const stripe = getStripe()
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   line_items: selectedAddons.map(addon => ({
    //     price: ADDON_PRICE_MAP[addon.id],
    //     quantity: 1
    //   })),
    //   metadata: {
    //     type: 'addon_purchase',
    //     client_id: clientId,
    //     addons: JSON.stringify(selectedAddons),
    //     pending_revisions: JSON.stringify(pendingRevisions)
    //   },
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/client?addon_success=true`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/client`
    // })
    // return NextResponse.json({ url: session.url })

    return NextResponse.json({
      success: true,
      message: 'Stripe integration pending',
      addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
      totalMonthly
    })
  } catch (error) {
    console.error('Error creating addon checkout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

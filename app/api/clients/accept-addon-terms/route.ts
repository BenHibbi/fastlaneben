import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { clientId } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the user is authenticated and owns this client
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the client and verify ownership
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, user_id, email')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify ownership (either by user_id or email)
    const clientData = client as { id: string; user_id: string | null; email: string }
    if (clientData.user_id !== user.id && clientData.email !== user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the client with the addon terms acceptance timestamp
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        addons_terms_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', clientId)

    if (updateError) {
      console.error('Failed to update client:', updateError)
      return NextResponse.json({ error: 'Failed to accept terms' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting addon terms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

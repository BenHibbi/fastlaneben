import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ModificationType } from '@/types/database'

export const runtime = 'nodejs'

const MAX_ROUNDS = 2
const MAX_MODIFICATIONS_PER_ROUND = 10

// POST - Client submits revision request
export async function POST(request: NextRequest) {
  try {
    const { clientId, modificationType, description } = await request.json()

    if (!clientId || !modificationType || !description) {
      return NextResponse.json(
        { error: 'Client ID, modification type, and description are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get client and check limits
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, state, revision_round, revision_modifications_used')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const clientData = client as { id: string; state: string; revision_round: number | null; revision_modifications_used: number | null }

    if (clientData.state !== 'FINAL_ONBOARDING') {
      return NextResponse.json(
        { error: 'Client is not in final onboarding state' },
        { status: 400 }
      )
    }

    const currentRound = clientData.revision_round || 1
    const modificationsUsed = clientData.revision_modifications_used || 0

    // Check if we've exceeded limits
    if (currentRound > MAX_ROUNDS) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_ROUNDS} revision rounds allowed. Please contact support for additional changes.`
        },
        { status: 400 }
      )
    }

    if (modificationsUsed >= MAX_MODIFICATIONS_PER_ROUND) {
      // Check if we can move to next round
      if (currentRound >= MAX_ROUNDS) {
        return NextResponse.json(
          {
            error: `You have used all ${MAX_MODIFICATIONS_PER_ROUND} modifications for both rounds. Please contact support for additional changes.`
          },
          { status: 400 }
        )
      }
      // Move to next round automatically handled by admin when they post new code
      return NextResponse.json(
        {
          error: `You have used all ${MAX_MODIFICATIONS_PER_ROUND} modifications for round ${currentRound}. Wait for the updated preview before requesting more changes.`
        },
        { status: 400 }
      )
    }

    // Create revision request
    const { data: revision, error: insertError } = await supabase
      .from('revision_requests')
      .insert({
        client_id: clientId,
        round_number: currentRound,
        modification_type: modificationType as ModificationType,
        description,
        status: 'pending'
      } as never)
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to submit revision request' },
        { status: 500 }
      )
    }

    // Update client modification count
    const newModificationsUsed = modificationsUsed + 1
    await supabase
      .from('clients')
      .update({
        revision_modifications_used: newModificationsUsed,
        onboarding_phase: 'revisions',
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', clientId)

    return NextResponse.json({
      success: true,
      revision,
      stats: {
        round: currentRound,
        modificationsUsed: newModificationsUsed,
        modificationsRemaining: MAX_MODIFICATIONS_PER_ROUND - newModificationsUsed,
        maxRounds: MAX_ROUNDS,
        maxModificationsPerRound: MAX_MODIFICATIONS_PER_ROUND
      }
    })
  } catch (error) {
    console.error('Revision error:', error)
    return NextResponse.json(
      { error: 'Failed to submit revision' },
      { status: 500 }
    )
  }
}

// GET - Fetch revision history for client
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get client stats
    const { data: client } = await supabase
      .from('clients')
      .select('revision_round, revision_modifications_used')
      .eq('id', clientId)
      .single()

    // Get all revisions
    const { data: revisions, error } = await supabase
      .from('revision_requests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch revisions' },
        { status: 500 }
      )
    }

    const clientData = client as { revision_round: number | null; revision_modifications_used: number | null } | null
    const currentRound = clientData?.revision_round || 1
    const modificationsUsed = clientData?.revision_modifications_used || 0

    return NextResponse.json({
      revisions: revisions || [],
      stats: {
        round: currentRound,
        modificationsUsed,
        modificationsRemaining: MAX_MODIFICATIONS_PER_ROUND - modificationsUsed,
        maxRounds: MAX_ROUNDS,
        maxModificationsPerRound: MAX_MODIFICATIONS_PER_ROUND
      }
    })
  } catch (error) {
    console.error('Get revisions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revisions' },
      { status: 500 }
    )
  }
}

// PATCH - Admin updates revision status
export async function PATCH(request: NextRequest) {
  try {
    const { revisionId, status, adminResponse } = await request.json()

    if (!revisionId || !status) {
      return NextResponse.json(
        { error: 'Revision ID and status are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const updateData: Record<string, unknown> = {
      status,
      admin_response: adminResponse || null
    }

    if (status === 'completed' || status === 'rejected') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: revision, error } = await supabase
      .from('revision_requests')
      .update(updateData as never)
      .eq('id', revisionId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update revision' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      revision
    })
  } catch (error) {
    console.error('Patch revision error:', error)
    return NextResponse.json(
      { error: 'Failed to update revision' },
      { status: 500 }
    )
  }
}

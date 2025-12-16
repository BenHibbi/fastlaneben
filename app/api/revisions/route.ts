import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revisionRequestSchema, validateRequest, uuidSchema } from '@/lib/validation'
import { REVISION_CONFIG } from '@/lib/config'
import { revisionLogger } from '@/lib/logger'
import type { Client, RevisionRequest } from '@/types/database'
import { z } from 'zod'

export const runtime = 'nodejs'

// Schema for PATCH requests
const revisionPatchSchema = z.object({
  revisionId: uuidSchema,
  status: z.enum(['pending', 'in_progress', 'completed', 'rejected']),
  adminResponse: z.string().max(2000).optional()
})

// POST - Client submits revision request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateRequest(revisionRequestSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { clientId, modificationType, description } = validation.data
    const supabase = createAdminClient()

    // Get client and check limits
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, state, revision_round, revision_modifications_used')
      .eq('id', clientId)
      .single()

    if (clientError || !clientData) {
      revisionLogger.warn('Client not found for revision', { clientId })
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const client = clientData as Pick<Client, 'id' | 'state' | 'revision_round' | 'revision_modifications_used'>

    if (client.state !== 'FINAL_ONBOARDING') {
      return NextResponse.json(
        { error: 'Client is not in final onboarding state' },
        { status: 400 }
      )
    }

    const currentRound = client.revision_round || 1
    const modificationsUsed = client.revision_modifications_used || 0

    // Check if we've exceeded limits
    if (currentRound > REVISION_CONFIG.MAX_ROUNDS) {
      return NextResponse.json(
        {
          error: `Maximum ${REVISION_CONFIG.MAX_ROUNDS} revision rounds allowed. Please contact support for additional changes.`
        },
        { status: 400 }
      )
    }

    if (modificationsUsed >= REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND) {
      if (currentRound >= REVISION_CONFIG.MAX_ROUNDS) {
        return NextResponse.json(
          {
            error: `You have used all ${REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND} modifications for both rounds. Please contact support for additional changes.`
          },
          { status: 400 }
        )
      }
      return NextResponse.json(
        {
          error: `You have used all ${REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND} modifications for round ${currentRound}. Wait for the updated preview before requesting more changes.`
        },
        { status: 400 }
      )
    }

    // Create revision request
    const { data: revisionData, error: insertError } = await supabase
      .from('revision_requests')
      .insert({
        client_id: clientId,
        round_number: currentRound,
        modification_type: modificationType,
        description,
        status: 'pending'
      } as never)
      .select()
      .single()

    if (insertError) {
      revisionLogger.error('Failed to insert revision', {
        clientId,
        error: insertError.message
      })
      return NextResponse.json(
        { error: 'Failed to submit revision request' },
        { status: 500 }
      )
    }

    const revision = revisionData as RevisionRequest

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

    revisionLogger.info('Revision submitted', {
      clientId,
      revisionId: revision.id,
      round: currentRound,
      modificationsUsed: newModificationsUsed
    })

    return NextResponse.json({
      success: true,
      revision,
      stats: {
        round: currentRound,
        modificationsUsed: newModificationsUsed,
        modificationsRemaining:
          REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND - newModificationsUsed,
        maxRounds: REVISION_CONFIG.MAX_ROUNDS,
        maxModificationsPerRound: REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND
      }
    })
  } catch (error) {
    revisionLogger.error('Revision error', {
      error: error instanceof Error ? error.message : String(error)
    })
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
    const { data: clientData } = await supabase
      .from('clients')
      .select('revision_round, revision_modifications_used')
      .eq('id', clientId)
      .single()

    const client = clientData as Pick<Client, 'revision_round' | 'revision_modifications_used'> | null

    // Get all revisions
    const { data: revisions, error } = await supabase
      .from('revision_requests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      revisionLogger.error('Failed to fetch revisions', {
        clientId,
        error: error.message
      })
      return NextResponse.json(
        { error: 'Failed to fetch revisions' },
        { status: 500 }
      )
    }

    const currentRound = client?.revision_round || 1
    const modificationsUsed = client?.revision_modifications_used || 0

    return NextResponse.json({
      revisions: revisions || [],
      stats: {
        round: currentRound,
        modificationsUsed,
        modificationsRemaining:
          REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND - modificationsUsed,
        maxRounds: REVISION_CONFIG.MAX_ROUNDS,
        maxModificationsPerRound: REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND
      }
    })
  } catch (error) {
    revisionLogger.error('Get revisions error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Failed to fetch revisions' },
      { status: 500 }
    )
  }
}

// PATCH - Admin updates revision status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateRequest(revisionPatchSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { revisionId, status, adminResponse } = validation.data

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
      revisionLogger.error('Failed to update revision', {
        revisionId,
        error: error.message
      })
      return NextResponse.json(
        { error: 'Failed to update revision' },
        { status: 500 }
      )
    }

    revisionLogger.info('Revision updated', { revisionId, status })

    return NextResponse.json({
      success: true,
      revision
    })
  } catch (error) {
    revisionLogger.error('Patch revision error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Failed to update revision' },
      { status: 500 }
    )
  }
}

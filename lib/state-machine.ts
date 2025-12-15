import type { ClientState, Client } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const STATES = [
  'INTAKE',
  'LOCKED',
  'PREVIEW_READY',
  'ACTIVATION',
  'FINAL_ONBOARDING',
  'LIVE',
  'SUPPORT'
] as const

export type TriggerType = 'CLIENT' | 'ADMIN' | 'SYSTEM' | 'WEBHOOK'

interface Transition {
  to: ClientState
  by: TriggerType[]
}

export const TRANSITIONS: Record<ClientState, Transition[]> = {
  INTAKE: [
    { to: 'LOCKED', by: ['CLIENT'] }
  ],
  LOCKED: [
    { to: 'PREVIEW_READY', by: ['ADMIN'] },
    { to: 'INTAKE', by: ['ADMIN'] } // Unlock for edits
  ],
  PREVIEW_READY: [
    { to: 'ACTIVATION', by: ['CLIENT'] }, // Approve preview
    { to: 'LOCKED', by: ['CLIENT'] } // Request revision
  ],
  ACTIVATION: [
    { to: 'FINAL_ONBOARDING', by: ['WEBHOOK', 'SYSTEM'] } // Payment success
  ],
  FINAL_ONBOARDING: [
    { to: 'LIVE', by: ['ADMIN'] } // Deploy site
  ],
  LIVE: [
    { to: 'SUPPORT', by: ['SYSTEM', 'CLIENT'] } // Auto or on first support request
  ],
  SUPPORT: [
    { to: 'LIVE', by: ['ADMIN'] } // Resolve back to live if needed
  ]
}

export const STATE_CONFIG: Record<ClientState, {
  label: string
  description: string
  color: string
}> = {
  INTAKE: {
    label: 'Getting Started',
    description: 'Tell us about your business',
    color: 'blue'
  },
  LOCKED: {
    label: 'In Review',
    description: "We're building your preview",
    color: 'yellow'
  },
  PREVIEW_READY: {
    label: 'Preview Ready',
    description: 'Review your site mockup',
    color: 'purple'
  },
  ACTIVATION: {
    label: 'Activate',
    description: 'Complete payment to continue',
    color: 'orange'
  },
  FINAL_ONBOARDING: {
    label: 'Final Details',
    description: 'Provide your final content',
    color: 'cyan'
  },
  LIVE: {
    label: 'Live',
    description: 'Your site is live!',
    color: 'green'
  },
  SUPPORT: {
    label: 'Support',
    description: "We're here to help",
    color: 'slate'
  }
}

export function canTransition(
  from: ClientState,
  to: ClientState,
  triggeredBy: TriggerType
): boolean {
  const validTransitions = TRANSITIONS[from]
  return validTransitions.some(
    t => t.to === to && t.by.includes(triggeredBy)
  )
}

export function getNextStates(from: ClientState, triggeredBy: TriggerType): ClientState[] {
  return TRANSITIONS[from]
    .filter(t => t.by.includes(triggeredBy))
    .map(t => t.to)
}

interface TransitionResult {
  success: boolean
  error?: string
  newState?: ClientState
}

export async function transitionClient(
  clientId: string,
  toState: ClientState,
  triggeredBy: TriggerType,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<TransitionResult> {
  // Use admin client for state transitions (bypasses RLS)
  const supabase = createAdminClient()

  // Get current client
  const { data: client, error: fetchError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (fetchError || !client) {
    return { success: false, error: 'Client not found' }
  }

  const typedClient = client as unknown as Client

  // Validate transition
  if (!canTransition(typedClient.state, toState, triggeredBy)) {
    return {
      success: false,
      error: `Invalid transition from ${typedClient.state} to ${toState} by ${triggeredBy}`
    }
  }

  // Perform transition
  const { error: updateError } = await supabase
    .from('clients')
    .update({
      state: toState,
      state_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as never)
    .eq('id', clientId)

  if (updateError) {
    return { success: false, error: 'Failed to update client state' }
  }

  // Log transition
  await supabase.from('state_transitions').insert({
    client_id: clientId,
    from_state: typedClient.state,
    to_state: toState,
    triggered_by: userId || null,
    trigger_type: triggeredBy,
    metadata: metadata || {}
  } as never)

  return { success: true, newState: toState }
}

// Get client's current state route
export function getStateRoute(state: ClientState): string {
  const routes: Record<ClientState, string> = {
    INTAKE: '/client/intake',
    LOCKED: '/client/locked',
    PREVIEW_READY: '/client/preview',
    ACTIVATION: '/client/activate',
    FINAL_ONBOARDING: '/client/final',
    LIVE: '/client/live',
    SUPPORT: '/client/support'
  }
  return routes[state]
}

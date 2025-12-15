/**
 * Type-safe helpers for Supabase operations.
 * These helpers provide a cleaner alternative to `as never` casts
 * when dealing with Supabase's strict TypeScript types.
 */

/**
 * Wraps update data to bypass Supabase's strict type checking.
 * Use this when you need to update partial fields that don't match
 * the exact generated types.
 *
 * @example
 * await supabase.from('clients').update(updateData({ state: 'LIVE' }))
 */
export function updateData<T extends Record<string, unknown>>(data: T): T {
  return data as never
}

/**
 * Wraps insert data to bypass Supabase's strict type checking.
 * Use this when inserting records with optional fields.
 *
 * @example
 * await supabase.from('state_transitions').insert(insertData({ client_id: '123', ... }))
 */
export function insertData<T extends Record<string, unknown>>(data: T): T {
  return data as never
}

/**
 * Creates a timestamp in ISO format for database operations.
 */
export function timestamp(): string {
  return new Date().toISOString()
}

/**
 * Creates common update fields (updated_at timestamp).
 */
export function withUpdatedAt<T extends Record<string, unknown>>(data: T): T & { updated_at: string } {
  return { ...data, updated_at: timestamp() } as never
}

/**
 * Creates common state change fields.
 */
export function withStateChange<T extends Record<string, unknown>>(
  data: T,
  newState: string
): T & { state: string; state_changed_at: string; updated_at: string } {
  return {
    ...data,
    state: newState,
    state_changed_at: timestamp(),
    updated_at: timestamp()
  } as never
}

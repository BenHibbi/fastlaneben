import { z } from 'zod'
import { INDUSTRIES, GOALS, STYLES, REVISION_CONFIG } from './config'
import type { ModificationType, ClientState } from '@/types/database'

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const emailSchema = z.string().email('Invalid email address')

export const urlSchema = z.string().url('Invalid URL').optional().nullable()

// ============================================================================
// API REQUEST SCHEMAS
// ============================================================================

// Voice Brief
export const voiceBriefUploadSchema = z.object({
  clientId: uuidSchema
})

export const voiceBriefAnalyzeSchema = z.object({
  clientId: uuidSchema,
  voiceBriefId: uuidSchema
})

// React Preview
export const reactPreviewPostSchema = z.object({
  clientId: uuidSchema,
  rawCode: z.string().min(10, 'Code is too short'),
  adminId: z.string().optional()
})

export const reactPreviewGetSchema = z.object({
  clientId: uuidSchema
})

// Revisions
export const revisionRequestSchema = z.object({
  clientId: uuidSchema,
  modificationType: z.enum([
    'text_change',
    'image_change',
    'section_change',
    'position_layout',
    'feature_request',
    'other'
  ] as const satisfies readonly ModificationType[]),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
})

export const revisionBatchSchema = z.object({
  clientId: uuidSchema,
  revisions: z
    .array(
      z.object({
        modificationType: z.enum([
          'text_change',
          'image_change',
          'section_change',
          'position_layout',
          'feature_request',
          'other'
        ] as const),
        description: z.string().min(10).max(1000)
      })
    )
    .min(1)
    .max(REVISION_CONFIG.MAX_MODIFICATIONS_PER_ROUND)
})

// Intake Form
export const intakeFormSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(100),
  industry: z.enum(INDUSTRIES as unknown as [string, ...string[]]),
  industry_other: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  goal: z.enum(GOALS as unknown as [string, ...string[]]),
  goal_other: z.string().max(200).optional(),
  style: z.enum(STYLES as unknown as [string, ...string[]]),
  description: z.string().max(2000).optional(),
  competitors: z.array(z.string().url()).max(5).optional()
})

// Stripe Checkout
export const checkoutSchema = z.object({
  clientId: uuidSchema,
  priceType: z.enum(['monthly', 'yearly']).default('monthly')
})

// Admin Actions
export const stateTransitionSchema = z.object({
  clientId: uuidSchema,
  fromState: z.enum([
    'INTAKE',
    'LOCKED',
    'PREVIEW_READY',
    'ACTIVATION',
    'FINAL_ONBOARDING',
    'LIVE',
    'SUPPORT'
  ] as const satisfies readonly ClientState[]),
  toState: z.enum([
    'INTAKE',
    'LOCKED',
    'PREVIEW_READY',
    'ACTIVATION',
    'FINAL_ONBOARDING',
    'LIVE',
    'SUPPORT'
  ] as const)
})

export const updateUrlsSchema = z.object({
  clientId: uuidSchema,
  previewUrl: urlSchema,
  liveUrl: urlSchema
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const errorMessage = result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')
  return { success: false, error: errorMessage }
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

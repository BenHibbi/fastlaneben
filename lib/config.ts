// ============================================================================
// CENTRALIZED CONFIGURATION
// ============================================================================

// Revision limits
export const REVISION_CONFIG = {
  MAX_ROUNDS: 2,
  MAX_MODIFICATIONS_PER_ROUND: 10
} as const

// Voice brief recording
export const VOICE_BRIEF_CONFIG = {
  MAX_RECORDING_SECONDS: 120, // 2 minutes
  AUDIO_MIME_TYPE: 'audio/webm'
} as const

// React preview
export const PREVIEW_CONFIG = {
  DESKTOP_HEIGHT: 900,
  MOBILE_WIDTH: 375,
  MOBILE_HEIGHT: 667
} as const

// URLs
export const URLS = {
  CLIENT_PORTAL: process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/client`
    : 'https://fastlanesites.com/client'
} as const

// Business constants
export const INDUSTRIES = [
  'Restaurant / Café',
  'Contractor / Trades',
  'Salon / Spa',
  'Retail / Shop',
  'Professional Services',
  'Health / Wellness',
  'Real Estate',
  'Creative / Agency',
  'Other'
] as const

export const GOALS = [
  'Get more phone calls',
  'Showcase my portfolio',
  'Book appointments online',
  'Build credibility',
  'Sell products',
  'Other'
] as const

export const STYLES = [
  'Clean & Minimal',
  'Bold & Modern',
  'Warm & Friendly',
  'Professional & Corporate',
  'Creative & Unique'
] as const

export type Industry = (typeof INDUSTRIES)[number]
export type Goal = (typeof GOALS)[number]
export type Style = (typeof STYLES)[number]

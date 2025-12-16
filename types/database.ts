export type ClientState =
  | 'INTAKE'
  | 'LOCKED'
  | 'PREVIEW_READY'
  | 'ACTIVATION'
  | 'FINAL_ONBOARDING'
  | 'LIVE'
  | 'SUPPORT'

// Onboarding phases within FINAL_ONBOARDING state
export type OnboardingPhase =
  | 'voice_brief'
  | 'references'
  | 'content'
  | 'building'
  | 'react_preview'
  | 'revisions'

// Creative brief status
export type CreativeBriefStatus =
  | 'not_started'
  | 'voice_recorded'
  | 'brief_generated'
  | 'complete'

// Revision modification types
export type ModificationType =
  | 'text_change'
  | 'image_change'
  | 'section_change'
  | 'position_layout'
  | 'feature_request'
  | 'other'

// Revision request status
export type RevisionStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string | null
          email: string
          state: ClientState
          state_changed_at: string
          business_name: string | null
          industry: string | null
          location: string | null
          intake_data: Json
          logo_url: string | null
          images: Json
          preview_url: string | null
          preview_screenshots: Json
          revision_requested: boolean
          revision_notes: string | null
          revisions_remaining: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          terms_accepted_at: string | null
          privacy_accepted_at: string | null
          final_content: Json
          final_images: Json
          live_url: string | null
          assigned_to: string | null
          internal_notes: string | null
          creative_brief_status: CreativeBriefStatus
          onboarding_phase: OnboardingPhase
          revision_round: number
          revision_modifications_used: number
          current_react_preview_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          state?: ClientState
          state_changed_at?: string
          business_name?: string | null
          industry?: string | null
          location?: string | null
          intake_data?: Json
          logo_url?: string | null
          images?: Json
          preview_url?: string | null
          preview_screenshots?: Json
          revision_requested?: boolean
          revision_notes?: string | null
          revisions_remaining?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          terms_accepted_at?: string | null
          privacy_accepted_at?: string | null
          final_content?: Json
          final_images?: Json
          live_url?: string | null
          assigned_to?: string | null
          internal_notes?: string | null
          creative_brief_status?: CreativeBriefStatus
          onboarding_phase?: OnboardingPhase
          revision_round?: number
          revision_modifications_used?: number
          current_react_preview_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          state?: ClientState
          state_changed_at?: string
          business_name?: string | null
          industry?: string | null
          location?: string | null
          intake_data?: Json
          logo_url?: string | null
          images?: Json
          preview_url?: string | null
          preview_screenshots?: Json
          revision_requested?: boolean
          revision_notes?: string | null
          revisions_remaining?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          terms_accepted_at?: string | null
          privacy_accepted_at?: string | null
          final_content?: Json
          final_images?: Json
          live_url?: string | null
          assigned_to?: string | null
          internal_notes?: string | null
          creative_brief_status?: CreativeBriefStatus
          onboarding_phase?: OnboardingPhase
          revision_round?: number
          revision_modifications_used?: number
          current_react_preview_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      state_transitions: {
        Row: {
          id: string
          client_id: string
          from_state: ClientState | null
          to_state: ClientState
          triggered_by: string | null
          trigger_type: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          from_state?: ClientState | null
          to_state: ClientState
          triggered_by?: string | null
          trigger_type: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          from_state?: ClientState | null
          to_state?: ClientState
          triggered_by?: string | null
          trigger_type?: string
          metadata?: Json
          created_at?: string
        }
      }
      support_requests: {
        Row: {
          id: string
          client_id: string
          request_type: string
          description: string
          attachments: Json
          status: string
          resolved_at: string | null
          admin_notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          request_type: string
          description: string
          attachments?: Json
          status?: string
          resolved_at?: string | null
          admin_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          request_type?: string
          description?: string
          attachments?: Json
          status?: string
          resolved_at?: string | null
          admin_notes?: string | null
          created_at?: string
        }
      }
      voice_briefs: {
        Row: {
          id: string
          client_id: string
          audio_url: string
          transcript: string | null
          structured_brief: Json
          duration_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          audio_url: string
          transcript?: string | null
          structured_brief?: Json
          duration_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          audio_url?: string
          transcript?: string | null
          structured_brief?: Json
          duration_seconds?: number | null
          created_at?: string
        }
      }
      reference_screenshots: {
        Row: {
          id: string
          client_id: string
          url: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          url: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          url?: string
          description?: string | null
          created_at?: string
        }
      }
      react_previews: {
        Row: {
          id: string
          client_id: string
          raw_code: string
          sanitized_code: string | null
          version: number
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          raw_code: string
          sanitized_code?: string | null
          version?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          raw_code?: string
          sanitized_code?: string | null
          version?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
      revision_requests: {
        Row: {
          id: string
          client_id: string
          round_number: number
          modification_type: ModificationType
          description: string
          admin_response: string | null
          status: RevisionStatus
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          round_number: number
          modification_type: ModificationType
          description: string
          admin_response?: string | null
          status?: RevisionStatus
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          round_number?: number
          modification_type?: ModificationType
          description?: string
          admin_response?: string | null
          status?: RevisionStatus
          created_at?: string
          resolved_at?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      client_state: ClientState
    }
  }
}

// Helper types
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type StateTransition = Database['public']['Tables']['state_transitions']['Row']
export type SupportRequest = Database['public']['Tables']['support_requests']['Row']
export type VoiceBrief = Database['public']['Tables']['voice_briefs']['Row']
export type VoiceBriefInsert = Database['public']['Tables']['voice_briefs']['Insert']
export type ReferenceScreenshot = Database['public']['Tables']['reference_screenshots']['Row']
export type ReferenceScreenshotInsert = Database['public']['Tables']['reference_screenshots']['Insert']
export type ReactPreview = Database['public']['Tables']['react_previews']['Row']
export type ReactPreviewInsert = Database['public']['Tables']['react_previews']['Insert']
export type RevisionRequest = Database['public']['Tables']['revision_requests']['Row']
export type RevisionRequestInsert = Database['public']['Tables']['revision_requests']['Insert']

// Modification types for revision dropdown
export const MODIFICATION_TYPES: { value: ModificationType; label: string }[] = [
  { value: 'text_change', label: 'Text Change' },
  { value: 'image_change', label: 'Image Change' },
  { value: 'section_change', label: 'Section Change' },
  { value: 'position_layout', label: 'Position / Layout' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'Other' }
]

// Onboarding phase config
export const ONBOARDING_PHASE_CONFIG: Record<
  OnboardingPhase,
  { label: string; description: string }
> = {
  voice_brief: { label: 'Voice Brief', description: 'Describe your vision' },
  references: { label: 'References', description: 'Share sites you like' },
  content: { label: 'Content', description: 'Provide your text' },
  building: { label: 'Building', description: 'We\'re creating your site' },
  react_preview: { label: 'Preview', description: 'Review your site' },
  revisions: { label: 'Revisions', description: 'Request changes' }
}

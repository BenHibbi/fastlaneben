export type ClientState =
  | 'INTAKE'
  | 'LOCKED'
  | 'PREVIEW_READY'
  | 'ACTIVATION'
  | 'FINAL_ONBOARDING'
  | 'LIVE'
  | 'SUPPORT'

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

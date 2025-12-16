-- Webhook events table for idempotency
-- Prevents duplicate processing of Stripe webhook events
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- Auto-cleanup old events (older than 30 days)
-- This can be run via a cron job or Supabase scheduled function

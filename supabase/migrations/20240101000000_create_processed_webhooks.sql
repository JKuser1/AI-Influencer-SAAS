-- Migration: create processed_webhooks table
-- Purpose: Prevent duplicate processing of Whop webhook events.
-- Run this SQL once in your Supabase project's SQL Editor.

create table if not exists processed_webhooks (
  id           text        primary key,   -- Whop webhook-id header value
  processed_at timestamptz not null default now()
);

-- Optional: auto-delete records older than 30 days to keep the table small.
-- (Whop retries stop within 24 hours so 30 days is a safe cleanup window.)
create index if not exists processed_webhooks_processed_at_idx
  on processed_webhooks (processed_at);

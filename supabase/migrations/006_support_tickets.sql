-- Migration: 006_support_tickets
-- Phase 6.2: Support System
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uwmjditvovqtyrbtwixw/sql/new
-- ─── Table ────────────────────────────────────────────────────────────────────
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  category text not null,
  description text not null,
  priority text not null default 'medium',
  status text not null default 'open',
  created_at timestamptz not null default now()
);
-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table support_tickets enable row level security;
-- Users can read and insert their own tickets
create policy "users_own_tickets" on support_tickets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- ─── Admin status updates (via service-role key, bypasses RLS) ───────────────
-- No extra policy needed — service-role always bypasses RLS.
-- To update ticket status from admin tooling:
--   supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', ticketId)
--   (using createAdminClient() which uses SUPABASE_SERVICE_ROLE_KEY)
-- ─── Valid values reference ───────────────────────────────────────────────────
-- category: billing | technical | account | feature-request | bug | other
-- priority: low | medium | high | urgent
-- status:   open | in-review | resolved
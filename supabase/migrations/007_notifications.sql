-- Migration: 007_notifications
-- Phase 6.3: Notification System
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/uwmjditvovqtyrbtwixw/sql/new
-- ─── Table ────────────────────────────────────────────────────────────────────
create table if not exists notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null,
    -- generation_complete | security_alert | system_message
    title text not null,
    body text not null default '',
    read boolean not null default false,
    created_at timestamptz not null default now()
);
-- Index for fast per-user queries
create index if not exists notifications_user_id_idx on notifications(user_id);
-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table notifications enable row level security;
-- Users can only read/delete their own notifications
create policy "users_own_notifications_read" on notifications for
select using (auth.uid() = user_id);
create policy "users_own_notifications_update" on notifications for
update using (auth.uid() = user_id);
create policy "users_own_notifications_delete" on notifications for delete using (auth.uid() = user_id);
-- Service-role (admin) can insert without restriction (bypasses RLS)
-- This means you use createAdminClient() when inserting notifications server-side.
-- ─── Enable Realtime (optional) ───────────────────────────────────────────────
-- Run in Supabase Dashboard → Database → Replication → Supabase Realtime
-- then add the 'notifications' table to the publication.
-- Or run:
--   alter publication supabase_realtime add table notifications;
-- ─── Valid type values ────────────────────────────────────────────────────────
-- type: generation_complete | security_alert | system_message
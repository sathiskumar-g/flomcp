-- ============================================================
-- FIX: mcp_servers Row Level Security policies
-- 
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
--
-- This fixes "Server not found" and empty "My MCP Servers" list.
-- ============================================================

-- 1. Make sure RLS is enabled
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- 2. Drop old/conflicting policies if they exist
DROP POLICY IF EXISTS mcp_servers_user_select   ON mcp_servers;
DROP POLICY IF EXISTS mcp_servers_user_insert   ON mcp_servers;
DROP POLICY IF EXISTS mcp_servers_user_update   ON mcp_servers;
DROP POLICY IF EXISTS mcp_servers_user_delete   ON mcp_servers;
DROP POLICY IF EXISTS mcp_servers_admin_all     ON mcp_servers;

-- 3. SELECT — users can only read their own servers
CREATE POLICY mcp_servers_user_select ON mcp_servers
  FOR SELECT USING (auth.uid() = user_id);

-- 4. INSERT — users can only insert rows for themselves
--    (admin client also bypasses this with service_role key)
CREATE POLICY mcp_servers_user_insert ON mcp_servers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. UPDATE — users can only update their own rows
CREATE POLICY mcp_servers_user_update ON mcp_servers
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. DELETE — users can only delete their own rows
CREATE POLICY mcp_servers_user_delete ON mcp_servers
  FOR DELETE USING (auth.uid() = user_id);

-- ── user_usage ──────────────────────────────────────────────
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_usage_user_select ON user_usage;
DROP POLICY IF EXISTS user_usage_user_insert ON user_usage;
DROP POLICY IF EXISTS user_usage_user_update ON user_usage;

CREATE POLICY user_usage_user_select ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_usage_user_insert ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_usage_user_update ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- ── suspicious_activity ─────────────────────────────────────
ALTER TABLE suspicious_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suspicious_activity_insert ON suspicious_activity;

-- Allow inserts from server (service role bypasses anyway)
CREATE POLICY suspicious_activity_insert ON suspicious_activity
  FOR INSERT WITH CHECK (true);

-- ── Verify ──────────────────────────────────────────────────
-- After running, confirm policies exist:
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('mcp_servers', 'user_usage', 'suspicious_activity')
ORDER BY tablename, policyname;

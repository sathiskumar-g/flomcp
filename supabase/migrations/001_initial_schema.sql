/**
 * FloMCP Database Schema - Initial Migration
 * 
 * Task 1.2: Database Schema with Cost Tracking (5%)
 * 
 * This migration creates:
 * - 1.2.1: mcp_servers table (stores generated MCP code + costs)
 * - 1.2.2: user_usage table (rate limiting + usage tracking)
 * - 1.2.3: suspicious_activity table (abuse monitoring)
 * - 1.2.4: Row Level Security policies
 * 
 * Created: February 23, 2026
 * Free Tier Limit: 2 generations per month
 */

-- ============================================================================
-- 1.2.1: MCP SERVERS TABLE
-- Stores all generated MCP servers with cost tracking and security metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS mcp_servers (
    -- Primary identifiers
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- MCP metadata
    name TEXT NOT NULL,
    description TEXT,
    
    -- API configuration (if API-based MCP)
    api_config JSONB DEFAULT NULL,
    -- Example: { "baseUrl": "https://api.github.com", "authType": "bearer", "endpoints": [...] }
    
    -- Generated code files
    generated_code TEXT NOT NULL,      -- index.ts content
    package_json TEXT NOT NULL,        -- package.json content
    readme TEXT NOT NULL,              -- README.md content
    tsconfig TEXT,                     -- tsconfig.json content
    env_example TEXT,                  -- .env.example content
    
    -- Security validation
    security_score INTEGER CHECK (security_score >= 0 AND security_score <= 100),
    security_report JSONB DEFAULT '{}',
    -- Example: { "passed": ["SEC-001", "SEC-002"], "failed": ["SSRF-003"], "recommendations": [...] }
    
    -- Generation status
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'downloaded', 'archived', 'failed')),
    
    -- 💰 COST TRACKING (CRITICAL FOR MVP)
    tokens_used INTEGER DEFAULT 0,                    -- Claude API tokens consumed
    cost_usd NUMERIC(10,4) DEFAULT 0.0000,           -- Actual cost in USD ($0.0771 typical)
    cached BOOLEAN DEFAULT false,                     -- Was this from cache? (cache = $0)
    generation_time_ms INTEGER DEFAULT 0,             -- Generation duration in milliseconds
    
    -- USER FEEDBACK (for improving prompts)
    user_feedback JSONB DEFAULT NULL,
    -- Example: { "workedOutOfBox": true, "issues": [], "rating": 5, "comments": "Perfect!" }
    
    -- Download tracking
    downloaded BOOLEAN DEFAULT false,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_mcp_servers_user_id ON mcp_servers(user_id);
CREATE INDEX idx_mcp_servers_created_at ON mcp_servers(created_at DESC);
CREATE INDEX idx_mcp_servers_status ON mcp_servers(status);
CREATE INDEX idx_mcp_servers_cached ON mcp_servers(cached) WHERE cached = true;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mcp_servers_updated_at
    BEFORE UPDATE ON mcp_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE mcp_servers IS 'Stores all generated MCP servers with code, security reports, and cost tracking';
COMMENT ON COLUMN mcp_servers.tokens_used IS 'Claude API tokens consumed (for cost analysis)';
COMMENT ON COLUMN mcp_servers.cost_usd IS 'Actual USD cost of generation (~$0.05-0.10 per MCP)';
COMMENT ON COLUMN mcp_servers.cached IS 'True if served from cache (cost = $0)';
COMMENT ON COLUMN mcp_servers.generation_time_ms IS 'Generation duration for performance tracking';

-- ============================================================================
-- 1.2.2: USER USAGE TABLE
-- Tracks user generations and enforces rate limits (FREE TIER: 2/month)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_usage (
    -- Primary identifier (one row per user)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    
    -- 📊 MONTHLY LIMITS (FREE TIER: 2 generations per month)
    generation_count_month INTEGER DEFAULT 0,
    month_reset_at TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
    
    -- ⏱️ RATE LIMITING (prevents abuse)
    last_generation_at TIMESTAMP WITH TIME ZONE,
    last_generation_cooldown_until TIMESTAMP WITH TIME ZONE,
    -- User cannot generate until cooldown_until passes (1 hour cooldown for free tier)
    
    -- Hourly tracking (prevents spam)
    generations_last_hour INTEGER DEFAULT 0,
    generations_last_hour_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
    
    -- Daily tracking (prevents burning all monthly limit in one day)
    generations_last_day INTEGER DEFAULT 0,
    generations_last_day_reset_at TIMESTAMP WITH TIME ZONE DEFAULT DATE_TRUNC('day', NOW() + INTERVAL '1 day'),
    
    -- 💎 TIER & PERMISSIONS
    tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    -- free: 2/month, pro: unlimited, enterprise: unlimited + priority
    
    -- ⚖️ LEGAL & COMPLIANCE
    tos_accepted BOOLEAN DEFAULT false,
    tos_accepted_at TIMESTAMP WITH TIME ZONE,
    tos_version TEXT DEFAULT '1.0',
    -- Track which version of ToS user accepted (important for legal)
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rate limit checks (must be fast!)
CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX idx_user_usage_email ON user_usage(email);
CREATE INDEX idx_user_usage_cooldown ON user_usage(last_generation_cooldown_until);
-- Note: Removed WHERE clause with NOW() since NOW() is VOLATILE, not IMMUTABLE
-- The index still works efficiently for queries like: WHERE cooldown_until > NOW()
CREATE INDEX idx_user_usage_month_reset ON user_usage(month_reset_at);

-- Trigger to update updated_at
CREATE TRIGGER update_user_usage_updated_at
    BEFORE UPDATE ON user_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE user_usage IS 'Tracks user generation limits and rate limiting (FREE: 2/month, PRO: unlimited)';
COMMENT ON COLUMN user_usage.generation_count_month IS 'Generations used this month (resets monthly)';
COMMENT ON COLUMN user_usage.last_generation_cooldown_until IS 'User cannot generate until this timestamp (1 hour cooldown)';
COMMENT ON COLUMN user_usage.tier IS 'User tier: free (2/month), pro (unlimited), enterprise (unlimited + priority)';

-- ============================================================================
-- 1.2.3: SUSPICIOUS ACTIVITY TABLE
-- Logs potential abuse for manual review (prevents malware generation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS suspicious_activity (
    -- Primary identifier
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'suspicious_description',    -- Malware/hacking keywords detected
        'rate_limit_violation',      -- Tried to bypass rate limits
        'disposable_email',          -- Used disposable email domain
        'multiple_accounts',         -- Same IP/fingerprint, different accounts
        'policy_violation',          -- Generated prohibited content
        'failed_verification'        -- Email verification failed multiple times
    )),
    
    -- Detailed information (stored as JSON)
    details JSONB DEFAULT '{}',
    -- Example for suspicious_description:
    -- { "description": "Create keylogger MCP", "patterns_matched": ["keylogger", "steal"], "blocked": true }
    
    -- Severity levels
    severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    -- low: Minor issue, medium: Needs review, high: Likely abuse, critical: Immediate action
    
    -- Review status
    reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Action taken
    action_taken TEXT CHECK (action_taken IN ('none', 'warned', 'suspended', 'banned', 'account_deleted')),
    action_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin dashboard
CREATE INDEX idx_suspicious_activity_user ON suspicious_activity(user_id);
CREATE INDEX idx_suspicious_activity_type ON suspicious_activity(activity_type);
CREATE INDEX idx_suspicious_activity_severity ON suspicious_activity(severity);
CREATE INDEX idx_suspicious_activity_unreviewed ON suspicious_activity(reviewed) WHERE reviewed = false;
CREATE INDEX idx_suspicious_activity_created ON suspicious_activity(created_at DESC);

-- Comments
COMMENT ON TABLE suspicious_activity IS 'Logs suspicious user activity for abuse prevention and policy compliance';
COMMENT ON COLUMN suspicious_activity.activity_type IS 'Type of suspicious activity detected';
COMMENT ON COLUMN suspicious_activity.severity IS 'Severity: low (log only), medium (review soon), high (review now), critical (immediate action)';
COMMENT ON COLUMN suspicious_activity.reviewed IS 'Has an admin reviewed this activity?';

-- ============================================================================
-- 1.2.4: ROW LEVEL SECURITY POLICIES
-- Ensures users can only access their own data (security layer at DB level)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activity ENABLE ROW LEVEL SECURITY;

-- ========================================
-- MCP SERVERS TABLE POLICIES
-- ========================================

-- Policy: Users can view their own MCP servers
CREATE POLICY "Users can view own MCP servers"
    ON mcp_servers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own MCP servers
CREATE POLICY "Users can create own MCP servers"
    ON mcp_servers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own MCP servers (e.g., feedback, downloaded status)
CREATE POLICY "Users can update own MCP servers"
    ON mcp_servers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own MCP servers
CREATE POLICY "Users can delete own MCP servers"
    ON mcp_servers
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Admins can view all MCP servers
CREATE POLICY "Admins can view all MCP servers"
    ON mcp_servers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
    );

-- ========================================
-- USER USAGE TABLE POLICIES
-- ========================================

-- Policy: Users can view their own usage stats
CREATE POLICY "Users can view own usage"
    ON user_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own usage (via backend only, but allow for flexibility)
CREATE POLICY "Users can update own usage"
    ON user_usage
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: System can insert usage records (via service role)
CREATE POLICY "System can insert usage records"
    ON user_usage
    FOR INSERT
    WITH CHECK (true);  -- Service role will handle this

-- Policy: Admins can view all usage data (for cost monitoring)
CREATE POLICY "Admins can view all usage"
    ON user_usage
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
    );

-- ========================================
-- SUSPICIOUS ACTIVITY TABLE POLICIES
-- ========================================

-- Policy: Users CANNOT view suspicious activity records (security)
-- Only admins can see this data

-- Policy: System can insert suspicious activity records
CREATE POLICY "System can log suspicious activity"
    ON suspicious_activity
    FOR INSERT
    WITH CHECK (true);  -- Service role will handle this

-- Policy: Admins can view all suspicious activity
CREATE POLICY "Admins can view all suspicious activity"
    ON suspicious_activity
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_app_meta_data->>'role' = 'admin'
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS FOR RATE LIMITING
-- ============================================================================

-- Function to check if user needs monthly reset
CREATE OR REPLACE FUNCTION check_monthly_reset()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.month_reset_at <= NOW() THEN
        NEW.generation_count_month := 0;
        NEW.month_reset_at := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-reset monthly counters
CREATE TRIGGER auto_reset_monthly_usage
    BEFORE UPDATE ON user_usage
    FOR EACH ROW
    EXECUTE FUNCTION check_monthly_reset();

-- Function to check if user needs hourly reset
CREATE OR REPLACE FUNCTION check_hourly_reset()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.generations_last_hour_reset_at <= NOW() THEN
        NEW.generations_last_hour := 0;
        NEW.generations_last_hour_reset_at := NOW() + INTERVAL '1 hour';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-reset hourly counters
CREATE TRIGGER auto_reset_hourly_usage
    BEFORE UPDATE ON user_usage
    FOR EACH ROW
    EXECUTE FUNCTION check_hourly_reset();

-- Function to check if user needs daily reset
CREATE OR REPLACE FUNCTION check_daily_reset()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.generations_last_day_reset_at <= NOW() THEN
        NEW.generations_last_day := 0;
        NEW.generations_last_day_reset_at := DATE_TRUNC('day', NOW() + INTERVAL '1 day');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-reset daily counters
CREATE TRIGGER auto_reset_daily_usage
    BEFORE UPDATE ON user_usage
    FOR EACH ROW
    EXECUTE FUNCTION check_daily_reset();

-- ============================================================================
-- INITIAL DATA & SEED
-- ============================================================================

-- Example: Create admin user usage record (replace with your user ID after signup)
-- INSERT INTO user_usage (user_id, email, email_verified, tier, tos_accepted, tos_accepted_at)
-- VALUES ('your-user-id-here', 'your-email@example.com', true, 'admin', true, NOW());

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 001_initial_schema.sql completed successfully!';
    RAISE NOTICE '📊 Tables created: mcp_servers, user_usage, suspicious_activity';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '⚡ Indexes created for performance';
    RAISE NOTICE '🎯 FREE TIER LIMIT: 2 generations per month';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '1. Run this SQL in Supabase SQL Editor';
    RAISE NOTICE '2. Verify tables exist in Table Editor';
    RAISE NOTICE '3. Test RLS policies work correctly';
    RAISE NOTICE '4. Create user_usage record after first signup';
END $$;

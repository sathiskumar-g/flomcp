/**
 * FloMCP Migration 008 — Credit System (Free Plan)
 *
 * Creates:
 *   - user_credits        — per-user credit balance (replaces generation_count_month for limits)
 *   - credit_transactions — immutable audit log of every credit event
 *
 * Free plan: 5 credits one-time, never expire, never reset.
 * Pro plan (future): 50 credits/month with rollover (handled in migration 009).
 *
 * Created: March 1, 2026
 */
-- ============================================================================
-- TABLE: user_credits
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Plan & balance
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  monthly_credits INT NOT NULL DEFAULT 5,
  -- Free: one-time lifetime; Pro: resets monthly
  bonus_credits INT NOT NULL DEFAULT 0,
  -- Pack purchases; never expire
  -- LemonSqueezy (populated when user upgrades — Phase 3)
  ls_customer_id TEXT,
  ls_subscription_id TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);
-- Index
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
-- Auto-update updated_at
CREATE OR REPLACE TRIGGER trg_user_credits_updated_at BEFORE
UPDATE ON user_credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- TABLE: credit_transactions
-- Immutable audit log — never UPDATE or DELETE rows here.
-- amount is negative for debits, positive for credits.
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Amount: negative = debit (generation), positive = credit (refund/signup/pack)
  amount INT NOT NULL,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('monthly', 'bonus')),
  reason TEXT NOT NULL CHECK (
    reason IN (
      'generation',
      'refund',
      'signup_bonus',
      'pack_purchase',
      'monthly_reset',
      'rollover',
      'admin'
    )
  ),
  -- Context
  generation_id UUID REFERENCES mcp_servers(id) ON DELETE
  SET NULL,
    complexity TEXT CHECK (complexity IN ('1', '2')),
    pack_name TEXT,
    ls_order_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
-- user_credits: users can read their own row; only service role can write
DROP POLICY IF EXISTS "users_read_own_credits" ON user_credits;
CREATE POLICY "users_read_own_credits" ON user_credits FOR
SELECT USING (auth.uid() = user_id);
-- credit_transactions: users can read their own history
DROP POLICY IF EXISTS "users_read_own_transactions" ON credit_transactions;
CREATE POLICY "users_read_own_transactions" ON credit_transactions FOR
SELECT USING (auth.uid() = user_id);
-- ============================================================================
-- FUNCTION: check_and_deduct_credits
-- Atomically checks balance and deducts credits.
-- Returns: { ok: bool, monthly_used: int, bonus_used: int, error: text }
-- Monthly credits are consumed first, then bonus credits.
-- ============================================================================
CREATE OR REPLACE FUNCTION check_and_deduct_credits(
    p_user_id UUID,
    p_cost INT,
    p_generation_id UUID DEFAULT NULL,
    p_complexity TEXT DEFAULT '1'
  ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_monthly INT;
v_bonus INT;
v_total INT;
v_monthly_use INT := 0;
v_bonus_use INT := 0;
BEGIN -- Lock the row for the duration of this transaction
SELECT monthly_credits,
  bonus_credits INTO v_monthly,
  v_bonus
FROM user_credits
WHERE user_id = p_user_id FOR
UPDATE;
IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'credits_row_missing');
END IF;
v_total := v_monthly + v_bonus;
IF v_total < p_cost THEN RETURN jsonb_build_object(
  'ok',
  false,
  'error',
  'insufficient_credits',
  'balance',
  v_total,
  'cost',
  p_cost
);
END IF;
-- Consume monthly first, then bonus
IF v_monthly >= p_cost THEN v_monthly_use := p_cost;
ELSE v_monthly_use := v_monthly;
v_bonus_use := p_cost - v_monthly;
END IF;
-- Deduct
UPDATE user_credits
SET monthly_credits = monthly_credits - v_monthly_use,
  bonus_credits = bonus_credits - v_bonus_use,
  updated_at = NOW()
WHERE user_id = p_user_id;
-- Audit log
IF v_monthly_use > 0 THEN
INSERT INTO credit_transactions (
    user_id,
    amount,
    credit_type,
    reason,
    generation_id,
    complexity
  )
VALUES (
    p_user_id,
    - v_monthly_use,
    'monthly',
    'generation',
    p_generation_id,
    p_complexity
  );
END IF;
IF v_bonus_use > 0 THEN
INSERT INTO credit_transactions (
    user_id,
    amount,
    credit_type,
    reason,
    generation_id,
    complexity
  )
VALUES (
    p_user_id,
    - v_bonus_use,
    'bonus',
    'generation',
    p_generation_id,
    p_complexity
  );
END IF;
RETURN jsonb_build_object(
  'ok',
  true,
  'monthly_used',
  v_monthly_use,
  'bonus_used',
  v_bonus_use,
  'balance_after',
  v_total - p_cost
);
END;
$$;
-- ============================================================================
-- FUNCTION: refund_credits
-- Refunds credits after a failed generation.
-- Restores to monthly first (reversed logic), capped at original limits.
-- ============================================================================
CREATE OR REPLACE FUNCTION refund_credits(
    p_user_id UUID,
    p_monthly_refund INT DEFAULT 0,
    p_bonus_refund INT DEFAULT 0,
    p_generation_id UUID DEFAULT NULL,
    p_notes TEXT DEFAULT 'generation_error_refund'
  ) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE user_credits
SET monthly_credits = monthly_credits + p_monthly_refund,
  bonus_credits = bonus_credits + p_bonus_refund,
  updated_at = NOW()
WHERE user_id = p_user_id;
IF p_monthly_refund > 0 THEN
INSERT INTO credit_transactions (
    user_id,
    amount,
    credit_type,
    reason,
    generation_id,
    notes
  )
VALUES (
    p_user_id,
    p_monthly_refund,
    'monthly',
    'refund',
    p_generation_id,
    p_notes
  );
END IF;
IF p_bonus_refund > 0 THEN
INSERT INTO credit_transactions (
    user_id,
    amount,
    credit_type,
    reason,
    generation_id,
    notes
  )
VALUES (
    p_user_id,
    p_bonus_refund,
    'bonus',
    'refund',
    p_generation_id,
    p_notes
  );
END IF;
END;
$$;
-- ============================================================================
-- TRIGGER: auto-create user_credits row on new user signup
-- Fires when a row is inserted into auth.users (via Supabase auth).
-- Note: must be run as superuser / in Supabase dashboard SQL editor.
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_new_user_credits() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
INSERT INTO public.user_credits (user_id, plan, monthly_credits, bonus_credits)
VALUES (NEW.id, 'free', 5, 0) ON CONFLICT (user_id) DO NOTHING;
-- Audit: signup bonus
INSERT INTO public.credit_transactions (user_id, amount, credit_type, reason)
VALUES (NEW.id, 5, 'monthly', 'signup_bonus');
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user_credits();
-- ============================================================================
-- SEED: backfill existing users who have no user_credits row yet
-- Each gets 5 free credits (one-time signup bonus).
-- ============================================================================
INSERT INTO user_credits (user_id, plan, monthly_credits, bonus_credits)
SELECT id,
  'free',
  5,
  0
FROM auth.users
WHERE id NOT IN (
    SELECT user_id
    FROM user_credits
  ) ON CONFLICT (user_id) DO NOTHING;
-- Audit log for the backfill
-- idempotent: only inserts for users who have no signup_bonus transaction yet
INSERT INTO credit_transactions (user_id, amount, credit_type, reason)
SELECT uc.user_id,
  5,
  'monthly',
  'signup_bonus'
FROM user_credits uc
WHERE NOT EXISTS (
    SELECT 1
    FROM credit_transactions ct
    WHERE ct.user_id = uc.user_id
      AND ct.reason = 'signup_bonus'
  );
/**
 * credits-service.ts
 *
 * Server-side helpers for checking, deducting, and refunding credits.
 * All writes use the Supabase admin client (service role) so they can
 * bypass RLS and work inside API routes.
 *
 * Free plan: 5 lifetime credits (monthly_credits column, never resets).
 * Pro  plan: 50/month with rollover (Phase 3 — not yet active).
 *
 * The heavy lifting (atomicity) lives in SQL functions:
 *   check_and_deduct_credits()
 *   refund_credits()
 */

import { createAdminClient } from "@/lib/supabase-admin";

// ─── Constants ────────────────────────────────────────────────────────────────

export const FREE_TIER_CREDITS = 5;
export const PRO_TIER_CREDITS  = 50;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreditBalance {
  plan: "free" | "pro" | "enterprise";
  monthly: number;
  bonus: number;
  total: number;
}

export interface DeductResult {
  ok: boolean;
  /** Credits used from the monthly bucket */
  monthlyUsed: number;
  /** Credits used from the bonus bucket */
  bonusUsed: number;
  /** Remaining total after deduction */
  balanceAfter: number;
  /** Only set when ok === false */
  error?: "insufficient_credits" | "credits_row_missing" | "unknown";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the current credit balance for a user.
 * Returns null if no row exists (e.g. a race between signup and first request).
 */
export async function getBalance(userId: string): Promise<CreditBalance | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_credits")
    .select("plan, monthly_credits, bonus_credits")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    plan:    data.plan as CreditBalance["plan"],
    monthly: data.monthly_credits as number,
    bonus:   data.bonus_credits   as number,
    total:   (data.monthly_credits as number) + (data.bonus_credits as number),
  };
}

/**
 * Ensure a user has a user_credits row.
 * Called during generate if the row might be missing (e.g. pre-migration users).
 * Safe to call multiple times — uses ON CONFLICT DO NOTHING.
 */
export async function ensureCreditRow(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("user_credits").upsert(
    { user_id: userId, plan: "free", monthly_credits: FREE_TIER_CREDITS, bonus_credits: 0 },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
}

/**
 * Atomically check balance and deduct credits.
 * Uses the check_and_deduct_credits() SQL function for atomic read-modify-write.
 *
 * @param userId       — Supabase user id
 * @param cost         — credits to deduct (1 or 2)
 * @param generationId — mcp_servers.id to associate in the audit log (optional pre-insert)
 * @param complexity   — "1" or "2" for the audit log
 */
export async function deductCredits(
  userId: string,
  cost: 1 | 2,
  generationId: string | null = null,
  complexity: "1" | "2" = "1"
): Promise<DeductResult> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("check_and_deduct_credits", {
    p_user_id:       userId,
    p_cost:          cost,
    p_generation_id: generationId,
    p_complexity:    complexity,
  });

  if (error) {
    console.error("[credits-service] deductCredits RPC error:", error.message);
    return { ok: false, monthlyUsed: 0, bonusUsed: 0, balanceAfter: 0, error: "unknown" };
  }

  const result = data as {
    ok: boolean;
    monthly_used?: number;
    bonus_used?:   number;
    balance_after?: number;
    error?: string;
    balance?: number;
    cost?: number;
  };

  if (!result.ok) {
    return {
      ok: false,
      monthlyUsed:  0,
      bonusUsed:    0,
      balanceAfter: result.balance ?? 0,
      error: (result.error as DeductResult["error"]) ?? "unknown",
    };
  }

  return {
    ok:           true,
    monthlyUsed:  result.monthly_used  ?? 0,
    bonusUsed:    result.bonus_used    ?? 0,
    balanceAfter: result.balance_after ?? 0,
  };
}

/**
 * Refund credits after a failed or errored generation.
 * Reverses the exact amounts taken from each bucket.
 */
export async function refundCredits(
  userId: string,
  monthlyUsed: number,
  bonusUsed: number,
  generationId: string | null = null,
  notes = "generation_error_refund"
): Promise<void> {
  if (monthlyUsed === 0 && bonusUsed === 0) return;

  const admin = createAdminClient();
  const { error } = await admin.rpc("refund_credits", {
    p_user_id:        userId,
    p_monthly_refund: monthlyUsed,
    p_bonus_refund:   bonusUsed,
    p_generation_id:  generationId,
    p_notes:          notes,
  });

  if (error) {
    // Log but don't re-throw — refund failure should not crash the error handler.
    console.error("[credits-service] refundCredits RPC error:", error.message);
  }
}

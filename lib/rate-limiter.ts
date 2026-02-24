/**
 * Rate Limiter — Task 1.4.1
 *
 * Server-side rate-limiting logic for MCP generation.
 * All checks hit the user_usage table in Supabase.
 *
 * Accepts a SupabaseClient so it can be used from any server context
 * (API routes, server actions, route handlers).
 *
 * Checks (in order):
 *  1. Email verified
 *  2. ToS accepted
 *  3. Cooldown period active
 *  4. Hourly limit
 *  5. Daily limit
 *  6. Monthly limit
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { RATE_LIMITS, formatCooldownTime } from "@/lib/constants/rate-limits";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  /** Whether the user is allowed to generate right now */
  allowed: boolean;
  /** Human-readable reason when not allowed */
  reason?: string;
  /** Upgrade URL shown when monthly limit is hit */
  upgradeUrl?: string;
  /** ISO timestamp of when the user can generate next (cooldown) */
  retryAfter?: string;
  /** Detailed state of each counter for display purposes */
  usage?: UsageSnapshot;
}

export interface UsageSnapshot {
  tier: string;
  generationCountMonth: number;
  generationsLastDay: number;
  generationsLastHour: number;
  lastGenerationAt: string | null;
  cooldownUntil: string | null;
  emailVerified: boolean;
  tosAccepted: boolean;
}

// Row shape we pull from user_usage
interface UserUsageRow {
  tier: string;
  email_verified: boolean;
  tos_accepted: boolean;
  generation_count_month: number;
  month_reset_at: string | null;
  generations_last_hour: number;
  generations_last_hour_reset_at: string | null;
  generations_last_day: number;
  generations_last_day_reset_at: string | null;
  last_generation_at: string | null;
  last_generation_cooldown_until: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the timestamp is in the past (or null → not expired)
 */
function isExpired(timestamp: string | null): boolean {
  if (!timestamp) return true;
  return new Date(timestamp) <= new Date();
}

/**
 * Resolve the effective per-hour / per-day / per-month counter values,
 * resetting them if their reset window has passed.
 *
 * This is a read-side normalisation — the actual DB update happens in
 * recordGeneration(). This ensures checkRateLimit() always sees
 * fresh effective values even if a background reset hasn't run yet.
 */
function resolveCounters(row: UserUsageRow): {
  generationsLastHour: number;
  generationsLastDay: number;
  generationCountMonth: number;
} {
  const now = new Date();

  const hourExpired =
    !row.generations_last_hour_reset_at ||
    new Date(row.generations_last_hour_reset_at) <= now;

  const dayExpired =
    !row.generations_last_day_reset_at ||
    new Date(row.generations_last_day_reset_at) <= now;

  const monthExpired =
    !row.month_reset_at ||
    new Date(row.month_reset_at) <= now;

  return {
    generationsLastHour: hourExpired ? 0 : row.generations_last_hour,
    generationsLastDay: dayExpired ? 0 : row.generations_last_day,
    generationCountMonth: monthExpired ? 0 : row.generation_count_month,
  };
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Check whether a user is allowed to generate an MCP server right now.
 *
 * @param supabase - Authenticated Supabase server client
 * @param userId   - Supabase auth UID
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  // ── Fetch usage row ──
  const { data, error } = await supabase
    .from("user_usage")
    .select(
      "tier, email_verified, tos_accepted, generation_count_month, month_reset_at, " +
      "generations_last_hour, generations_last_hour_reset_at, " +
      "generations_last_day, generations_last_day_reset_at, " +
      "last_generation_at, last_generation_cooldown_until"
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // No row found — user hasn't generated before; treat as allowed
    // (generation API will upsert the row on first use)
    return { allowed: true };
  }

  const row = data as unknown as UserUsageRow;
  const limits = RATE_LIMITS[row.tier] ?? RATE_LIMITS.free;
  const now = new Date();

  const { generationsLastHour, generationsLastDay, generationCountMonth } =
    resolveCounters(row);

  const snapshot: UsageSnapshot = {
    tier: row.tier,
    generationCountMonth,
    generationsLastDay,
    generationsLastHour,
    lastGenerationAt: row.last_generation_at,
    cooldownUntil: row.last_generation_cooldown_until,
    emailVerified: row.email_verified,
    tosAccepted: row.tos_accepted,
  };

  // ── Check 1: Email verified ──
  if (!row.email_verified) {
    return {
      allowed: false,
      reason: "Your email address is not verified. Please check your inbox.",
      usage: snapshot,
    };
  }

  // ── Check 2: ToS accepted ──
  if (!row.tos_accepted) {
    return {
      allowed: false,
      reason: "You must accept the Terms of Service before generating.",
      usage: snapshot,
    };
  }

  // ── Check 3: Cooldown ──
  if (
    row.last_generation_cooldown_until &&
    new Date(row.last_generation_cooldown_until) > now
  ) {
    const msRemaining =
      new Date(row.last_generation_cooldown_until).getTime() - now.getTime();
    return {
      allowed: false,
      reason: `Cooldown active. Next generation available in ${formatCooldownTime(msRemaining)}.`,
      retryAfter: row.last_generation_cooldown_until,
      usage: snapshot,
    };
  }

  // ── Check 4: Hourly limit ──
  if (generationsLastHour >= limits.perHour) {
    return {
      allowed: false,
      reason: `Hourly limit reached (${limits.perHour}/hour). Please wait before generating again.`,
      usage: snapshot,
    };
  }

  // ── Check 5: Daily limit ──
  if (generationsLastDay >= limits.perDay) {
    return {
      allowed: false,
      reason: `Daily limit reached (${limits.perDay}/day). Come back tomorrow!`,
      usage: snapshot,
    };
  }

  // ── Check 6: Monthly limit ──
  if (
    limits.perMonth !== Infinity &&
    generationCountMonth >= limits.perMonth
  ) {
    return {
      allowed: false,
      reason: `Free tier limit reached (${limits.perMonth}/month). Upgrade to Pro for unlimited generations.`,
      upgradeUrl: "/pricing",
      usage: snapshot,
    };
  }

  return { allowed: true, usage: snapshot };
}

/**
 * Record a successful generation — increments counters and sets cooldown.
 * Call this AFTER the generation succeeds (not before).
 *
 * @param supabase - Authenticated Supabase server client
 * @param userId   - Supabase auth UID
 * @param tier     - User's current tier (determines cooldown length)
 */
export async function recordGeneration(
  supabase: SupabaseClient,
  userId: string,
  tier: string = "free"
): Promise<void> {
  const limits = RATE_LIMITS[tier] ?? RATE_LIMITS.free;
  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + limits.cooldownMs);

  // Window reset timestamps
  const hourResetAt = new Date(now.getTime() + 60 * 60 * 1000);          // +1h
  const dayResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);      // +24h
  const monthResetAt = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  );                                                                        // 1st of next month (UTC)

  // Fetch current counters (to decide whether to reset or increment)
  const { data: current } = await supabase
    .from("user_usage")
    .select(
      "generation_count_month, month_reset_at, " +
      "generations_last_hour, generations_last_hour_reset_at, " +
      "generations_last_day, generations_last_day_reset_at"
    )
    .eq("user_id", userId)
    .single();

  if (!current) {
    // First generation — insert fresh row
    await supabase.from("user_usage").upsert({
      user_id: userId,
      tier,
      email_verified: true,
      tos_accepted: true,
      generation_count_month: 1,
      month_reset_at: monthResetAt.toISOString(),
      generations_last_hour: 1,
      generations_last_hour_reset_at: hourResetAt.toISOString(),
      generations_last_day: 1,
      generations_last_day_reset_at: dayResetAt.toISOString(),
      last_generation_at: now.toISOString(),
      last_generation_cooldown_until: cooldownUntil.toISOString(),
      updated_at: now.toISOString(),
    });
    return;
  }

  const row = current as unknown as UserUsageRow;
  const { generationsLastHour, generationsLastDay, generationCountMonth } =
    resolveCounters(row);

  // Compute whether windows are expiring on this write
  const hourExpired = isExpired(row.generations_last_hour_reset_at);
  const dayExpired = isExpired(row.generations_last_day_reset_at);
  const monthExpired = isExpired(row.month_reset_at);

  await supabase
    .from("user_usage")
    .update({
      generation_count_month: generationCountMonth + 1,
      month_reset_at: monthExpired ? monthResetAt.toISOString() : row.month_reset_at,
      generations_last_hour: generationsLastHour + 1,
      generations_last_hour_reset_at: hourExpired
        ? hourResetAt.toISOString()
        : row.generations_last_hour_reset_at,
      generations_last_day: generationsLastDay + 1,
      generations_last_day_reset_at: dayExpired
        ? dayResetAt.toISOString()
        : row.generations_last_day_reset_at,
      last_generation_at: now.toISOString(),
      last_generation_cooldown_until: cooldownUntil.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);
}

/**
 * Convenience: get the full rate-limit state for a user (read-only, no side effects).
 * Used by UsageStats component.
 */
export async function getUserUsageSnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageSnapshot | null> {
  const { data, error } = await supabase
    .from("user_usage")
    .select(
      "tier, email_verified, tos_accepted, generation_count_month, month_reset_at, " +
      "generations_last_hour, generations_last_hour_reset_at, " +
      "generations_last_day, generations_last_day_reset_at, " +
      "last_generation_at, last_generation_cooldown_until"
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  const row = data as unknown as UserUsageRow;
  const { generationsLastHour, generationsLastDay, generationCountMonth } =
    resolveCounters(row);

  return {
    tier: row.tier,
    generationCountMonth,
    generationsLastDay,
    generationsLastHour,
    lastGenerationAt: row.last_generation_at,
    cooldownUntil: row.last_generation_cooldown_until,
    emailVerified: row.email_verified,
    tosAccepted: row.tos_accepted,
  };
}

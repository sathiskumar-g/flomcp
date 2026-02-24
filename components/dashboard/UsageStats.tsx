"use client";

/**
 * UsageStats Component — Task 1.4.2
 *
 * Displays the user's live generation limits with:
 * - Live countdown timer until cooldown expires
 * - Progress bars for hourly / daily / monthly usage
 * - Green → yellow → red colour coding
 * - Upgrade CTA when hitting limit
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Zap,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { RATE_LIMITS, formatCooldownTime } from "@/lib/constants/rate-limits";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageRow {
  tier: string;
  generation_count_month: number;
  generations_last_hour: number;
  generations_last_day: number;
  last_generation_at: string | null;
  last_generation_cooldown_until: string | null;
  month_reset_at: string | null;
  generations_last_hour_reset_at: string | null;
  generations_last_day_reset_at: string | null;
  email_verified: boolean;
  tos_accepted: boolean;
}

interface UsageStatsProps {
  userId: string;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  value,
  max,
  label,
  icon: Icon,
}: {
  value: number;
  max: number | typeof Infinity;
  label: string;
  icon: React.ElementType;
}) {
  if (max === Infinity) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
          <span className="font-medium text-green-500">{value} used · unlimited</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full w-full bg-green-500/30 rounded-full" />
        </div>
      </div>
    );
  }

  const pct = Math.min(100, (value / max) * 100);
  const barColor =
    pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-yellow-500" : "bg-green-500";
  const textColor =
    pct >= 100
      ? "text-red-500"
      : pct >= 75
      ? "text-yellow-500"
      : "text-green-600 dark:text-green-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className={`font-medium ${textColor}`}>
          {value} / {max}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UsageStats({ userId }: UsageStatsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [usage, setUsage] = useState<UsageRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Live countdown: seconds remaining in cooldown
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);

  // ── Fetch usage row ──
  const fetchUsage = useCallback(async () => {
    const { data } = await supabase
      .from("user_usage")
      .select(
        "tier, generation_count_month, generations_last_hour, generations_last_day, " +
        "last_generation_at, last_generation_cooldown_until, month_reset_at, " +
        "generations_last_hour_reset_at, generations_last_day_reset_at, " +
        "email_verified, tos_accepted"
      )
      .eq("user_id", userId)
      .single();

    setUsage(data as UsageRow | null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // ── Live countdown ticker ──
  useEffect(() => {
    if (!usage?.last_generation_cooldown_until) {
      setCooldownSecondsLeft(0);
      return;
    }

    const update = () => {
      const ms =
        new Date(usage.last_generation_cooldown_until!).getTime() - Date.now();
      setCooldownSecondsLeft(Math.max(0, Math.ceil(ms / 1000)));
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [usage?.last_generation_cooldown_until]);

  // ── States ──
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!usage) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No usage data yet. Generate your first MCP server!
        </CardContent>
      </Card>
    );
  }

  const tier = usage.tier ?? "free";
  const limits = RATE_LIMITS[tier] ?? RATE_LIMITS.free;

  // Resolve counters (treat expired windows as 0)
  const now = Date.now();
  const hourExpired =
    !usage.generations_last_hour_reset_at ||
    new Date(usage.generations_last_hour_reset_at).getTime() <= now;
  const dayExpired =
    !usage.generations_last_day_reset_at ||
    new Date(usage.generations_last_day_reset_at).getTime() <= now;
  const monthExpired =
    !usage.month_reset_at || new Date(usage.month_reset_at).getTime() <= now;

  const hourCount = hourExpired ? 0 : usage.generations_last_hour;
  const dayCount = dayExpired ? 0 : usage.generations_last_day;
  const monthCount = monthExpired ? 0 : usage.generation_count_month;

  const inCooldown = cooldownSecondsLeft > 0;
  const atMonthlyLimit =
    limits.perMonth !== Infinity && monthCount >= limits.perMonth;

  // Status badge
  let statusLabel = "Ready to generate";
  let statusColor = "text-green-600 dark:text-green-400";
  let StatusIcon = CheckCircle2;

  if (inCooldown) {
    statusLabel = `Cooldown — ${formatCooldownTime(cooldownSecondsLeft * 1000)}`;
    statusColor = "text-yellow-600 dark:text-yellow-400";
    StatusIcon = Clock;
  } else if (atMonthlyLimit) {
    statusLabel = "Monthly limit reached";
    statusColor = "text-red-500";
    StatusIcon = AlertTriangle;
  }

  // Month reset display
  const monthResetDisplay = usage.month_reset_at
    ? new Date(usage.month_reset_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      })
    : "next month";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Generation Usage</CardTitle>
            <CardDescription>
              {tier === "free"
                ? `Free plan · resets ${monthResetDisplay}`
                : `${limits.displayName} plan · unlimited`}
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="capitalize text-xs border-primary/30 text-primary"
          >
            {limits.displayName ?? tier}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Status row */}
        <div className={`flex items-center gap-2 text-sm font-medium ${statusColor}`}>
          <StatusIcon className="h-4 w-4" />
          {statusLabel}
        </div>

        {/* Cooldown countdown */}
        {inCooldown && (
          <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
            <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Cooldown active</p>
              <p className="text-xs text-muted-foreground">
                Next generation available in{" "}
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {formatCooldownTime(cooldownSecondsLeft * 1000)}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Progress bars */}
        <div className="space-y-4">
          <ProgressBar
            value={hourCount}
            max={limits.perHour}
            label="This hour"
            icon={Zap}
          />
          <ProgressBar
            value={dayCount}
            max={limits.perDay}
            label="Today"
            icon={Calendar}
          />
          <ProgressBar
            value={monthCount}
            max={limits.perMonth}
            label="This month"
            icon={TrendingUp}
          />
        </div>

        {/* Last generation */}
        {usage.last_generation_at && (
          <p className="text-xs text-muted-foreground">
            Last generated:{" "}
            {new Date(usage.last_generation_at).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}

        {/* Upgrade CTA */}
        {atMonthlyLimit && tier === "free" && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-medium">Monthly limit reached</p>
            <p className="text-xs text-muted-foreground">
              Upgrade to Pro for unlimited generations, shorter cooldowns, and
              priority support.
            </p>
            <Button
              size="sm"
              onClick={() => router.push("/pricing")}
              className="w-full"
            >
              Upgrade to Pro
              <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

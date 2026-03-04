"use client";

/**
 * CreditChip — shows the user's remaining credits with a 🪙 coin icon.
 * Reads from /api/credits/balance (user_credits table).
 * Used in: Sidebar footer, UserMenu trigger, any top-right header.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CreditChipProps {
  /** Extra CSS classes. */
  className?: string;
  /**
   * "badge"  → 🪙 5             (compact, for UserMenu trigger)
   * "pill"   → 🪙 5 credits     (medium, default — for Sidebar)
   * "inline" → 🪙 5 / 5 credits (full label, for standalone use)
   */
  variant?: "badge" | "pill" | "inline";
}

const FREE_TIER_LIMIT = 5;

export function CreditChip({ className, variant = "pill" }: CreditChipProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit]         = useState<number>(FREE_TIER_LIMIT);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/credits/balance");
        if (!res.ok || cancelled) return;
        const data: { plan: string; monthly: number; bonus: number; total: number } = await res.json();
        if (cancelled) return;
        const tierLimit = data.plan === "pro" ? 50 : FREE_TIER_LIMIT;
        setLimit(tierLimit);
        setRemaining(Math.max(0, data.total));
      } catch {
        // fail silently — not a blocking UI element
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isEmpty  = remaining === 0;
  const isLow    = remaining !== null && remaining <= 1 && !isEmpty;

  const colorCls = isEmpty
    ? "bg-red-500/10 text-red-600 border-red-500/20"
    : isLow
    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
    : "bg-primary/10 text-primary border-primary/20";

  if (remaining === null) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border text-xs font-medium animate-pulse",
          "px-2 py-0.5 bg-muted/50 text-muted-foreground border-border/40",
          className
        )}
      >
        🪙 …
      </span>
    );
  }

  const label =
    variant === "badge"
      ? `🪙 ${remaining}`
      : variant === "inline"
      ? `🪙 ${remaining} / ${limit}`
      : `🪙 ${remaining} credit${remaining !== 1 ? "s" : ""}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border text-xs font-medium px-2 py-0.5",
        colorCls,
        className
      )}
    >
      {label}
    </span>
  );
}


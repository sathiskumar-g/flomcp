"use client";

/**
 * SecurityBadge — compact score pill for dashboard lists and detail pages.
 *
 * Sizes:
 *   sm  — 24px circle, used in server list cards
 *   md  — 40px circle, used in detail page header
 *   lg  — 64px circle, used in full security report header
 */

import { cn } from "@/lib/utils";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import type { SecurityGrade } from "@/lib/security/types";
import { getGrade, getScoreColor, getScoreBg } from "@/lib/security/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SecurityBadgeProps {
  score: number | null;
  passedChecks?: number;
  totalChecks?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showCount?: boolean;
  className?: string;
}

// ─── Grade display helpers ────────────────────────────────────────────────────

function IconForGrade({
  grade,
  className,
}: {
  grade: SecurityGrade;
  className?: string;
}) {
  if (grade === "A+" || grade === "A") {
    return <ShieldCheck className={className} />;
  }
  if (grade === "B" || grade === "C") {
    return <Shield className={className} />;
  }
  return <ShieldAlert className={className} />;
}

function ringColor(score: number): string {
  if (score >= 85) return "ring-green-500/30";
  if (score >= 70) return "ring-blue-500/30";
  if (score >= 55) return "ring-yellow-500/30";
  if (score >= 40) return "ring-orange-500/30";
  return "ring-red-500/30";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SecurityBadge({
  score,
  passedChecks,
  totalChecks = 22,
  size = "md",
  showLabel = true,
  showCount = false,
  className,
}: SecurityBadgeProps) {
  // null/undefined score → "not yet analysed" state
  if (score === null || score === undefined) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div
          className={cn(
            "rounded-full flex items-center justify-center ring-2",
            "bg-muted/50 ring-border",
            size === "sm" && "h-6 w-6",
            size === "md" && "h-10 w-10",
            size === "lg" && "h-16 w-16"
          )}
        >
          <Shield
            className={cn(
              "text-muted-foreground/60",
              size === "sm" && "h-3 w-3",
              size === "md" && "h-5 w-5",
              size === "lg" && "h-8 w-8"
            )}
          />
        </div>
        {showLabel && (
          <span className="text-xs text-muted-foreground">Not analysed</span>
        )}
      </div>
    );
  }

  const grade = getGrade(score);
  const scoreColor = getScoreColor(score);
  const scoreBg = getScoreBg(score);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Score circle */}
      <div
        className={cn(
          "rounded-full flex items-center justify-center ring-2 border",
          scoreBg,
          ringColor(score),
          size === "sm" && "h-6 w-6",
          size === "md" && "h-10 w-10",
          size === "lg" && "h-16 w-16"
        )}
        title={`Security score: ${score}/100 — ${grade}`}
      >
        {size === "sm" ? (
          <span className={cn("text-[9px] font-bold leading-none", scoreColor)}>
            {score}
          </span>
        ) : size === "md" ? (
          <span className={cn("text-xs font-bold leading-none", scoreColor)}>
            {score}
          </span>
        ) : (
          <span className={cn("text-xl font-bold leading-none", scoreColor)}>
            {score}
          </span>
        )}
      </div>

      {/* Labels */}
      {(showLabel || showCount) && (
        <div className="flex flex-col leading-tight">
          {showLabel && (
            <div className="flex items-center gap-1">
              <IconForGrade
                grade={grade}
                className={cn(
                  scoreColor,
                  size === "sm" && "h-3 w-3",
                  size === "md" && "h-3.5 w-3.5",
                  size === "lg" && "h-5 w-5"
                )}
              />
              <span
                className={cn(
                  "font-semibold",
                  scoreColor,
                  size === "sm" && "text-xs",
                  size === "md" && "text-sm",
                  size === "lg" && "text-base"
                )}
              >
                Grade {grade}
              </span>
            </div>
          )}
          {showCount && passedChecks !== undefined && (
            <span className="text-[11px] text-muted-foreground">
              {passedChecks}/{totalChecks} checks passed
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inline variant (for server list rows) ────────────────────────────────────

export function SecurityScorePill({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  if (score === null || score === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
          "bg-muted/50 text-muted-foreground border border-border",
          className
        )}
      >
        <Shield className="h-2.5 w-2.5" />
        N/A
      </span>
    );
  }

  const grade = getGrade(score);
  const scoreBg = getScoreBg(score);
  const scoreColor = getScoreColor(score);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border",
        scoreBg,
        className
      )}
      title={`Security score: ${score}/100`}
    >
      <IconForGrade grade={grade} className={cn("h-2.5 w-2.5", scoreColor)} />
      <span className={scoreColor}>{score}</span>
    </span>
  );
}

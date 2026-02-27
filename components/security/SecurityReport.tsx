"use client";

/**
 * SecurityReport — full security validation report card.
 *
 * Shows:
 *  - Overall score + grade
 *  - Category breakdown bars
 *  - Individual check results (expandable)
 *  - Download gate warning (score < 70)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Minus,
  ChevronDown,
  ChevronUp,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SecurityReport as SecurityReportType,
  SecurityCheck,
  CategoryReport,
  CheckCategory,
  Severity,
} from "@/lib/security/types";
import {
  getGradeColor,
  getScoreColor,
  getScoreBg,
  getSeverityColor,
  SEVERITY_LABELS,
  getGrade,
} from "@/lib/security/types";
import { SecurityBadge } from "./SecurityBadge";
import { Recommendations } from "./Recommendations";

// ─── Category icon map ────────────────────────────────────────────────────────

function CategoryIcon({
  name,
  className,
}: {
  name: CheckCategory;
  className?: string;
}) {
  switch (name) {
    case "Secret Management":
      return <Lock className={className} />;
    case "Input Validation":
      return <Shield className={className} />;
    case "SSRF Prevention":
      return <ShieldAlert className={className} />;
    case "Command Execution":
      return <AlertTriangle className={className} />;
    case "Error Handling":
      return <ShieldCheck className={className} />;
    case "Dependencies":
      return <RefreshCw className={className} />;
  }
}

// ─── Check row ────────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: SecurityCheck }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = check.notApplicable ? (
    <Minus className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
  ) : check.passed ? (
    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
  );

  const hasExpansion =
    !check.notApplicable && (!!check.details || !!check.recommendation);

  return (
    <div
      className={cn(
        "rounded-md",
        !check.notApplicable && !check.passed && "bg-red-500/5",
        check.passed && "bg-transparent"
      )}
    >
      <button
        onClick={() => hasExpansion && setExpanded((p) => !p)}
        className={cn(
          "w-full flex items-start gap-2.5 p-2.5 text-left rounded-md",
          hasExpansion && "hover:bg-muted/30 transition-colors cursor-pointer",
          !hasExpansion && "cursor-default"
        )}
        disabled={!hasExpansion}
        aria-expanded={hasExpansion ? expanded : undefined}
      >
        {statusIcon}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "text-xs font-medium",
                check.notApplicable && "text-muted-foreground/60",
                !check.notApplicable && !check.passed && "text-foreground",
                check.passed && "text-foreground"
              )}
            >
              {check.name}
            </span>
            <span className="text-[10px] text-muted-foreground/50 font-mono">
              {check.id}
            </span>
            <Badge
              className={cn(
                "text-[9px] px-1 py-0 h-3.5 border ml-auto",
                check.notApplicable
                  ? "text-muted-foreground bg-muted/30 border-border"
                  : getSeverityColor(check.severity)
              )}
              variant="outline"
            >
              {check.notApplicable ? "N/A" : SEVERITY_LABELS[check.severity]}
            </Badge>
          </div>
          <p
            className={cn(
              "text-[11px] mt-0.5",
              check.notApplicable
                ? "text-muted-foreground/50"
                : check.passed
                  ? "text-muted-foreground"
                  : "text-muted-foreground"
            )}
          >
            {check.message}
          </p>
        </div>

        {hasExpansion && (
          <div className="flex-shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </div>
        )}
      </button>

      {/* Expandable detail */}
      {expanded && hasExpansion && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border/30 mt-0">
          {check.details && (
            <p className="text-[11px] text-muted-foreground pt-2">{check.details}</p>
          )}
          {check.recommendation && (
            <div className="bg-muted/30 rounded p-2.5 border border-border/30">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Fix
              </p>
              <pre className="text-[11px] font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {check.recommendation}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  checks,
}: {
  category: CategoryReport;
  checks: SecurityCheck[];
}) {
  const [open, setOpen] = useState(category.failed > 0);

  const catChecks = checks.filter((c) => c.category === category.name);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      {/* Header bar */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <CategoryIcon
          name={category.name}
          className={cn(
            "h-4 w-4 flex-shrink-0",
            category.score >= 85
              ? "text-green-500"
              : category.score >= 70
                ? "text-blue-500"
                : category.score >= 50
                  ? "text-yellow-500"
                  : "text-red-500"
          )}
        />

        <span className="text-sm font-medium flex-1 text-left">{category.name}</span>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {category.na > 0 && (
            <span className="text-muted-foreground/50">{category.na} N/A</span>
          )}
          {category.failed > 0 && (
            <span className="text-red-400">{category.failed} failed</span>
          )}
          <span className="text-green-500">{category.passed} passed</span>
          <span
            className={cn(
              "font-semibold w-10 text-right",
              category.score >= 85
                ? "text-green-500"
                : category.score >= 70
                  ? "text-blue-500"
                  : category.score >= 50
                    ? "text-yellow-500"
                    : "text-red-500"
            )}
          >
            {category.score}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-16 h-1.5 rounded-full bg-muted/60 overflow-hidden flex-shrink-0">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              category.score >= 85
                ? "bg-green-500"
                : category.score >= 70
                  ? "bg-blue-500"
                  : category.score >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
            )}
            style={{ width: `${category.score}%` }}
          />
        </div>

        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Check rows */}
      {open && (
        <div className="px-3 py-2 space-y-1 divide-y divide-border/20">
          {catChecks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Download Gate Banner ─────────────────────────────────────────────────────

function DownloadGateBanner({ score }: { score: number }) {
  if (score >= 70) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
      <ShieldAlert className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-red-500">Download Blocked</p>
        <p className="text-xs text-muted-foreground mt-1">
          Security score {score}/100 is below the minimum threshold of 70. Fix the{" "}
          <strong>critical</strong> and <strong>high</strong> severity issues above to unlock
          download. You can override this gate after reviewing all risks.
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SecurityReportProps {
  report: SecurityReportType;
  onRevalidate?: () => void;
  isRevalidating?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

export function SecurityReport({
  report,
  onRevalidate,
  isRevalidating = false,
  showRecommendations = true,
  className,
}: SecurityReportProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            {/* Score circle — large */}
            <SecurityBadge
              score={report.score}
              passedChecks={report.passedChecks}
              totalChecks={report.totalChecks}
              size="lg"
              showLabel={true}
              showCount={true}
            />

            {/* Summary */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <CardTitle className="text-base">Security Analysis</CardTitle>
                {onRevalidate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRevalidate}
                    disabled={isRevalidating}
                    className="h-8 text-xs gap-1.5"
                  >
                    <RefreshCw
                      className={cn("h-3.5 w-3.5", isRevalidating && "animate-spin")}
                    />
                    {isRevalidating ? "Re-scanning…" : "Re-scan"}
                  </Button>
                )}
              </div>

              {/* Stat pills */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-500 border border-green-500/20 rounded-full px-2.5 py-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {report.passedChecks} passed
                </span>
                {report.failedChecks > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-500/10 text-red-500 border border-red-500/20 rounded-full px-2.5 py-1">
                    <XCircle className="h-3 w-3" />
                    {report.failedChecks} failed
                  </span>
                )}
                {report.naChecks > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted/50 text-muted-foreground border border-border rounded-full px-2.5 py-1">
                    <Minus className="h-3 w-3" />
                    {report.naChecks} N/A
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-2.5 py-1">
                  22 total checks
                </span>
              </div>

              {/* Timestamp */}
              <p className="text-[11px] text-muted-foreground/60 mt-2">
                Scanned{" "}
                {new Date(report.timestamp).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </CardHeader>

        {/* Overall score bar */}
        <CardContent className="pt-0 pb-4">
          <div className="w-full h-2 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                report.score >= 85
                  ? "bg-green-500"
                  : report.score >= 70
                    ? "bg-blue-500"
                    : report.score >= 55
                      ? "bg-yellow-500"
                      : report.score >= 40
                        ? "bg-orange-500"
                        : "bg-red-500"
              )}
              style={{ width: `${report.score}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">0</span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Score: {report.score}/100
            </span>
            <span className="text-[10px] text-muted-foreground">100</span>
          </div>
        </CardContent>
      </Card>

      {/* Download gate */}
      <DownloadGateBanner score={report.score} />

      {/* Category breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Category Breakdown
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Click a category to expand and inspect individual checks.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {report.categories.map((cat) => (
            <CategorySection
              key={cat.name}
              category={cat}
              checks={report.checks}
            />
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {showRecommendations && report.recommendations.length > 0 && (
        <Recommendations recommendations={report.recommendations} />
      )}
    </div>
  );
}

// Re-export for convenience
export type { SecurityReportType };

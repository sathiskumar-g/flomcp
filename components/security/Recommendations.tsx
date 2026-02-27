"use client";

/**
 * Recommendations — ordered list of security improvements.
 * Grouped by priority: critical → high → medium → low.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Recommendation, Severity } from "@/lib/security/types";
import { getSeverityColor, SEVERITY_LABELS } from "@/lib/security/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PriorityIcon({
  priority,
  className,
}: {
  priority: Severity;
  className?: string;
}) {
  switch (priority) {
    case "critical":
      return <AlertCircle className={cn("h-4 w-4", className)} />;
    case "high":
      return <AlertTriangle className={cn("h-4 w-4", className)} />;
    case "medium":
      return <Info className={cn("h-4 w-4", className)} />;
    case "low":
      return <Lightbulb className={cn("h-4 w-4", className)} />;
    default:
      return <Info className={cn("h-4 w-4", className)} />;
  }
}

// ─── Single Recommendation Card ───────────────────────────────────────────────

function RecommendationItem({
  rec,
  index,
}: {
  rec: Recommendation;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0); // first one open by default

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden",
        rec.priority === "critical" && "border-red-500/20",
        rec.priority === "high" && "border-orange-500/20",
        rec.priority === "medium" && "border-yellow-500/20",
        rec.priority === "low" && "border-blue-400/20"
      )}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
        aria-expanded={expanded}
      >
        {/* Priority icon */}
        <div
          className={cn(
            "mt-0.5 rounded-full p-1 flex-shrink-0",
            rec.priority === "critical" && "bg-red-500/10 text-red-500",
            rec.priority === "high" && "bg-orange-500/10 text-orange-500",
            rec.priority === "medium" && "bg-yellow-500/10 text-yellow-500",
            rec.priority === "low" && "bg-blue-400/10 text-blue-400"
          )}
        >
          <PriorityIcon priority={rec.priority} className="h-3.5 w-3.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">{rec.title}</span>
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 border",
                getSeverityColor(rec.priority)
              )}
              variant="outline"
            >
              {rec.checkId}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {rec.description}
          </p>
        </div>

        {/* Expand toggle */}
        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expandable body */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border/30 space-y-3">
          {/* How to fix */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              How to Fix
            </p>
            <pre className="text-xs bg-muted/40 rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-border/30">
              {rec.howToFix}
            </pre>
          </div>

          {/* Doc link */}
          {rec.docLink && (
            <a
              href={rec.docLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              OWASP / Reference Documentation
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Grouped Section ──────────────────────────────────────────────────────────

function PrioritySection({
  priority,
  recommendations,
}: {
  priority: Severity;
  recommendations: Recommendation[];
}) {
  if (recommendations.length === 0) return null;

  const label = SEVERITY_LABELS[priority];
  const colors: Record<Severity, string> = {
    critical: "text-red-500",
    high: "text-orange-500",
    medium: "text-yellow-500",
    low: "text-blue-400",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <PriorityIcon priority={priority} className={cn("h-3.5 w-3.5", colors[priority])} />
        <span className={cn("text-xs font-semibold uppercase tracking-wide", colors[priority])}>
          {label} Priority — {recommendations.length} issue{recommendations.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2">
        {recommendations.map((rec, i) => (
          <RecommendationItem key={rec.checkId} rec={rec} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface RecommendationsProps {
  recommendations: Recommendation[];
  className?: string;
}

export function Recommendations({
  recommendations,
  className,
}: RecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <Card className={cn("border-green-500/20", className)}>
        <CardContent className="pt-6 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 mb-3">
            <AlertCircle className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-sm font-medium text-green-500">No Issues Found</p>
          <p className="text-xs text-muted-foreground mt-1">
            All security checks passed. Your MCP server follows security best practices.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by priority
  const bySeverity: Record<Severity, Recommendation[]> = {
    critical: recommendations.filter((r) => r.priority === "critical"),
    high: recommendations.filter((r) => r.priority === "high"),
    medium: recommendations.filter((r) => r.priority === "medium"),
    low: recommendations.filter((r) => r.priority === "low"),
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-500" />
          Security Recommendations
          <Badge variant="secondary" className="ml-auto text-xs">
            {recommendations.length} to fix
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Prioritised fixes to improve your MCP server's security score. Critical and high issues
          should be addressed before deployment.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <PrioritySection priority="critical" recommendations={bySeverity.critical} />
        <PrioritySection priority="high" recommendations={bySeverity.high} />
        <PrioritySection priority="medium" recommendations={bySeverity.medium} />
        <PrioritySection priority="low" recommendations={bySeverity.low} />
      </CardContent>
    </Card>
  );
}

// ─── Compact variant (for inline use) ────────────────────────────────────────

export function RecommendationCount({
  count,
  criticalCount,
}: {
  count: number;
  criticalCount: number;
}) {
  if (count === 0) {
    return (
      <span className="text-xs text-green-500 font-medium">All checks passed</span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {criticalCount > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3" />
          {criticalCount} critical
        </span>
      )}
      <span className="text-xs text-muted-foreground">
        {count} fix{count !== 1 ? "es" : ""} needed
      </span>
    </div>
  );
}

export type { Recommendation };

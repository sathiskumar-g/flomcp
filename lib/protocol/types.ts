/**
 * MCP Protocol Compliance Validator — Type Definitions
 *
 * Types for the 10-check MCP protocol compliance layer.
 * Separate from the 22-check OWASP security validator (lib/security/).
 *
 * Severity model:
 *   blocker — causes "it doesn't work in Claude Desktop"; auto-fix triggered
 *   warning — bad practice / subtle bug; surfaced in the report but not fatal
 */

// ─── Severity ─────────────────────────────────────────────────────────────────

export type ProtocolSeverity = "blocker" | "warning";

export const PROTOCOL_SEVERITY_LABELS: Record<ProtocolSeverity, string> = {
  blocker: "Blocker",
  warning: "Warning",
};

export function getProtocolSeverityColor(severity: ProtocolSeverity): string {
  return severity === "blocker"
    ? "text-red-500 bg-red-500/10 border-red-500/30"
    : "text-amber-500 bg-amber-500/10 border-amber-500/30";
}

// ─── Individual Check ─────────────────────────────────────────────────────────

export interface ProtocolCheck {
  /** Unique identifier — PROTO-001 … PROTO-010 */
  id: string;
  /** Human-readable name */
  name: string;
  severity: ProtocolSeverity;
  /** Whether this check passes */
  passed: boolean;
  /**
   * When true, this check does not apply (e.g. resource checks when no
   * resources are defined). N/A checks are excluded from counts.
   */
  notApplicable: boolean;
  /** One-sentence status message */
  message: string;
  /** Optional extra detail about what was found */
  details?: string;
  /** Recommended fix — shown as pre-formatted code */
  recommendation?: string;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface ProtocolReport {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  naChecks: number;
  /** Number of failed blocker checks */
  blockerCount: number;
  /** Number of failed warning checks */
  warningCount: number;
  checks: ProtocolCheck[];
  /** True if any blocker was found on the first run */
  hadBlockers: boolean;
  /** True if targeted re-generation was triggered and succeeded */
  autoFixed: boolean;
  timestamp: string;
}

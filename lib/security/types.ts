/**
 * Security Validation Engine — Type Definitions
 *
 * All types for the 22-check security validation system.
 * Used by validator.ts, individual check files, UI components, and the API.
 */

// ─── Severity ─────────────────────────────────────────────────────────────────

export type Severity = "critical" | "high" | "medium" | "low";

export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  high: 5,
  medium: 2,
  low: 1,
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// ─── Categories ───────────────────────────────────────────────────────────────

export type CheckCategory =
  | "Secret Management"
  | "Input Validation"
  | "SSRF Prevention"
  | "Command Execution"
  | "Error Handling"
  | "Dependencies";

export const CHECK_CATEGORIES: CheckCategory[] = [
  "Secret Management",
  "Input Validation",
  "SSRF Prevention",
  "Command Execution",
  "Error Handling",
  "Dependencies",
];

// ─── Individual Check ─────────────────────────────────────────────────────────

export interface SecurityCheck {
  /** Unique identifier, e.g. "SEC-001" */
  id: string;
  /** Human-readable name */
  name: string;
  category: CheckCategory;
  severity: Severity;
  /** Whether this check passes */
  passed: boolean;
  /**
   * When true the check is not relevant for this server
   * (e.g., SSRF checks when the server makes no HTTP calls).
   * N/A checks are excluded from scoring.
   */
  notApplicable: boolean;
  /** One-sentence status message */
  message: string;
  /** Optional extra detail about what was found */
  details?: string;
  /** Specific recommended fix */
  recommendation?: string;
}

// ─── Category Roll-up ─────────────────────────────────────────────────────────

export interface CategoryReport {
  name: CheckCategory;
  /** 0–100 score for this category */
  score: number;
  passed: number;
  failed: number;
  /** Not-applicable checks in this category */
  na: number;
  total: number;
}

// ─── Recommendation ───────────────────────────────────────────────────────────

export interface Recommendation {
  checkId: string;
  priority: Severity;
  title: string;
  description: string;
  howToFix: string;
  docLink?: string;
}

// ─── Full Report ──────────────────────────────────────────────────────────────

export type SecurityGrade = "A+" | "A" | "B" | "C" | "D" | "F";

export interface SecurityReport {
  /** Weighted 0–100 */
  score: number;
  grade: SecurityGrade;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  naChecks: number;
  categories: CategoryReport[];
  checks: SecurityCheck[];
  recommendations: Recommendation[];
  /** Whether download should be blocked (score < 70) */
  blockDownload: boolean;
  timestamp: string;
}

// ─── Input to Validator ───────────────────────────────────────────────────────

export interface CodeFiles {
  /** Content of src/index.ts */
  indexTs: string;
  /** Content of package.json */
  packageJson: string;
  /** Content of tsconfig.json (optional) */
  tsconfig?: string;
  /** Content of .env.example (optional) */
  envExample?: string;
}

// ─── Grade Thresholds ─────────────────────────────────────────────────────────

export function getGrade(score: number): SecurityGrade {
  if (score >= 97) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function getGradeColor(grade: SecurityGrade): string {
  switch (grade) {
    case "A+":
    case "A":
      return "text-green-500";
    case "B":
      return "text-blue-500";
    case "C":
      return "text-yellow-500";
    case "D":
      return "text-orange-500";
    case "F":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

export function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-500";
  if (score >= 70) return "text-blue-500";
  if (score >= 55) return "text-yellow-500";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

export function getScoreBg(score: number): string {
  if (score >= 85) return "bg-green-500/10 border-green-500/20";
  if (score >= 70) return "bg-blue-500/10 border-blue-500/20";
  if (score >= 55) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 40) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "text-red-500 bg-red-500/10 border-red-500/20";
    case "high":
      return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    case "medium":
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    case "low":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

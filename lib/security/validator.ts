/**
 * Security Validation Engine — Main Orchestrator
 *
 * Runs all 22 security checks, calculates a weighted score (0-100),
 * assigns a grade, and produces an actionable report with recommendations.
 *
 * Usage:
 *   import { runSecurityValidation } from "@/lib/security/validator";
 *   const report = runSecurityValidation({ indexTs, packageJson, tsconfig, envExample });
 */

import type {
  SecurityCheck,
  SecurityReport,
  CategoryReport,
  Recommendation,
  CodeFiles,
  CheckCategory,
} from "./types";

import { SEVERITY_WEIGHTS, CHECK_CATEGORIES, getGrade } from "./types";

// ── Secret Management ────────────────────────────────────────────────────────
import { checkHardcodedSecrets } from "./checks/secret-management";
import { checkEnvironmentVariables } from "./checks/secret-management";
import { checkNoSecretsInLogs } from "./checks/secret-management";
import { checkEnvExample } from "./checks/secret-management";
import { checkSecretStartupValidation } from "./checks/secret-management";
import { checkAuthTokenRedaction } from "./checks/secret-management";

// ── Input Validation ─────────────────────────────────────────────────────────
import { checkSchemaValidation } from "./checks/input-validation";
import { checkTypeScriptStrict } from "./checks/input-validation";
import { checkBoundaryChecking } from "./checks/input-validation";
import { checkInputSanitization } from "./checks/input-validation";
import { checkRequiredFields } from "./checks/input-validation";

// ── SSRF Prevention ──────────────────────────────────────────────────────────
import { checkURLAllowlist } from "./checks/ssrf-prevention";
import { checkMetadataEndpointBlocking } from "./checks/ssrf-prevention";
import { checkInternalIPBlocking } from "./checks/ssrf-prevention";
import { checkFetchWithTimeout } from "./checks/ssrf-prevention";

// ── Command Execution ────────────────────────────────────────────────────────
import { checkNoShellExecution } from "./checks/command-execution";
import { checkNoEval } from "./checks/command-execution";
import { checkExecutionTimeouts } from "./checks/command-execution";

// ── Error Handling ───────────────────────────────────────────────────────────
import { checkSanitizeErrorUsage } from "./checks/error-handling";
import { checkTryCatchBlocks } from "./checks/error-handling";

// ── Dependencies ─────────────────────────────────────────────────────────────
import { checkNonVulnerableDependencies } from "./checks/dependencies";
import { checkMinimalDependencies } from "./checks/dependencies";

// ─── Run All Checks ───────────────────────────────────────────────────────────

function runAllChecks(files: CodeFiles): SecurityCheck[] {
  return [
    // Secret Management
    checkHardcodedSecrets(files),
    checkEnvironmentVariables(files),
    checkNoSecretsInLogs(files),
    checkEnvExample(files),
    checkSecretStartupValidation(files),
    checkAuthTokenRedaction(files),

    // Input Validation
    checkSchemaValidation(files),
    checkTypeScriptStrict(files),
    checkBoundaryChecking(files),
    checkInputSanitization(files),
    checkRequiredFields(files),

    // SSRF Prevention
    checkURLAllowlist(files),
    checkMetadataEndpointBlocking(files),
    checkInternalIPBlocking(files),
    checkFetchWithTimeout(files),

    // Command Execution
    checkNoShellExecution(files),
    checkNoEval(files),
    checkExecutionTimeouts(files),

    // Error Handling
    checkSanitizeErrorUsage(files),
    checkTryCatchBlocks(files),

    // Dependencies
    checkNonVulnerableDependencies(files),
    checkMinimalDependencies(files),
  ];
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function calculateScore(checks: SecurityCheck[]): number {
  let earnedWeight = 0;
  let totalPossibleWeight = 0;

  for (const check of checks) {
    if (check.notApplicable) continue; // exclude N/A from both sides
    const weight = SEVERITY_WEIGHTS[check.severity];
    totalPossibleWeight += weight;
    if (check.passed) earnedWeight += weight;
  }

  if (totalPossibleWeight === 0) return 100; // nothing to check = full marks

  return Math.round((earnedWeight / totalPossibleWeight) * 100);
}

// ─── Category Roll-ups ────────────────────────────────────────────────────────

function buildCategoryReports(checks: SecurityCheck[]): CategoryReport[] {
  return CHECK_CATEGORIES.map((category: CheckCategory) => {
    const catChecks = checks.filter((c) => c.category === category);
    const applicable = catChecks.filter((c) => !c.notApplicable);
    const passed = applicable.filter((c) => c.passed).length;
    const failed = applicable.filter((c) => !c.passed).length;
    const na = catChecks.filter((c) => c.notApplicable).length;

    // Category score
    let earnedWeight = 0;
    let totalWeight = 0;
    for (const check of applicable) {
      const w = SEVERITY_WEIGHTS[check.severity];
      totalWeight += w;
      if (check.passed) earnedWeight += w;
    }

    const score = totalWeight === 0 ? 100 : Math.round((earnedWeight / totalWeight) * 100);

    return {
      name: category,
      score,
      passed,
      failed,
      na,
      total: catChecks.length,
    };
  });
}

// ─── Recommendations ─────────────────────────────────────────────────────────

const DOC_LINKS: Record<string, string> = {
  "SEC-001": "https://owasp.org/www-project-top-ten/2021/A02_2021-Cryptographic_Failures",
  "SEC-002": "https://12factor.net/config",
  "SEC-003": "https://owasp.org/www-community/attacks/Log_Injection",
  "SEC-004": "https://12factor.net/config",
  "SEC-005": "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
  "SEC-006": "https://owasp.org/www-project-top-ten/2021/A07_2021-Identification_and_Authentication_Failures",
  "VAL-001": "https://zod.dev",
  "VAL-002": "https://www.typescriptlang.org/tsconfig#strict",
  "VAL-003": "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
  "VAL-004": "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html",
  "VAL-005": "https://zod.dev/#optional",
  "SSRF-001": "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html",
  "SSRF-002": "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html",
  "SSRF-003": "https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html",
  "SSRF-004": "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static",
  "CMD-001": "https://owasp.org/www-community/attacks/Command_Injection",
  "CMD-002": "https://owasp.org/www-community/attacks/Direct_Dynamic_Code_Evaluation_Eval%20Injection",
  "CMD-003": "https://developer.mozilla.org/en-US/docs/Web/API/AbortController",
  "ERR-001": "https://owasp.org/www-project-top-ten/2021/A09_2021-Security_Logging_and_Monitoring_Failures",
  "ERR-002": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch",
  "DEP-001": "https://owasp.org/www-project-top-ten/2021/A06_2021-Vulnerable_and_Outdated_Components",
  "DEP-002": "https://owasp.org/www-project-top-ten/2021/A06_2021-Vulnerable_and_Outdated_Components",
};

function buildRecommendations(checks: SecurityCheck[]): Recommendation[] {
  const failed = checks.filter((c) => !c.passed && !c.notApplicable);

  // Sort by severity weight descending — most critical first
  const sorted = [...failed].sort(
    (a, b) => SEVERITY_WEIGHTS[b.severity] - SEVERITY_WEIGHTS[a.severity]
  );

  return sorted.map((check): Recommendation => ({
    checkId: check.id,
    priority: check.severity,
    title: `Fix ${check.id}: ${check.name}`,
    description: check.message,
    howToFix: check.recommendation ?? `Address the ${check.severity} issue in ${check.category}.`,
    docLink: DOC_LINKS[check.id],
  }));
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Run all 22 security checks and return a fully populated SecurityReport.
 * @param files - The generated code files to analyse
 */
export function runSecurityValidation(files: CodeFiles): SecurityReport {
  const checks = runAllChecks(files);

  const score = calculateScore(checks);
  const grade = getGrade(score);

  const passedChecks = checks.filter((c) => c.passed && !c.notApplicable).length;
  const failedChecks = checks.filter((c) => !c.passed && !c.notApplicable).length;
  const naChecks = checks.filter((c) => c.notApplicable).length;

  const categories = buildCategoryReports(checks);
  const recommendations = buildRecommendations(checks);

  return {
    score,
    grade,
    totalChecks: checks.length,
    passedChecks,
    failedChecks,
    naChecks,
    categories,
    checks,
    recommendations,
    blockDownload: score < 70,
    timestamp: new Date().toISOString(),
  };
}

// Re-export types so consumers only need to import from this one file
export type {
  SecurityCheck,
  SecurityReport,
  CategoryReport,
  Recommendation,
  CodeFiles,
} from "./types";

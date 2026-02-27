/**
 * Security Checks — Dependencies (DEP-001 to DEP-002)
 */

import type { SecurityCheck, CodeFiles } from "../types";
import {
  anyMatch,
  VULNERABLE_PACKAGE_PATTERNS,
  extractPackageNames,
  EXPECTED_PACKAGES,
  MAX_EXPECTED_PROD_DEPS,
} from "../patterns";

// ─── DEP-001: No Known Vulnerable Packages ────────────────────────────────────

export function checkNonVulnerableDependencies(files: CodeFiles): SecurityCheck {
  const packageJson = files.packageJson;

  if (!packageJson || packageJson.trim() === "{}") {
    return {
      id: "DEP-001",
      name: "No Known Vulnerable Packages",
      category: "Dependencies",
      severity: "low",
      passed: true,
      notApplicable: true,
      message: "No package.json provided to check for vulnerable dependencies.",
    };
  }

  const foundVulnerable: string[] = [];

  for (const pattern of VULNERABLE_PACKAGE_PATTERNS) {
    const re = new RegExp(pattern.source, "gim");
    const matches = packageJson.match(re) ?? [];
    foundVulnerable.push(...matches.map((m) => m.trim().slice(0, 60)));
  }

  // Deduplicate
  const uniqueVuln = [...new Set(foundVulnerable)];
  const passed = uniqueVuln.length === 0;

  return {
    id: "DEP-001",
    name: "No Known Vulnerable Packages",
    category: "Dependencies",
    severity: "low",
    passed,
    notApplicable: false,
    message: passed
      ? "No known vulnerable packages detected in package.json."
      : `${uniqueVuln.length} potentially vulnerable package(s) detected.`,
    details: passed ? undefined : `Packages flagged: ${uniqueVuln.join(" | ")}`,
    recommendation: passed
      ? undefined
      : "Remove deprecated/known-vulnerable packages. Run 'npm audit' after installation. Replace moment with date-fns, request with node-fetch/fetch, lodash with native ES2022 methods.",
  };
}

// ─── DEP-002: Minimal Dependencies ───────────────────────────────────────────

export function checkMinimalDependencies(files: CodeFiles): SecurityCheck {
  const packageJson = files.packageJson;

  if (!packageJson || packageJson.trim() === "{}") {
    return {
      id: "DEP-002",
      name: "Minimal Dependencies",
      category: "Dependencies",
      severity: "low",
      passed: true,
      notApplicable: true,
      message: "No package.json provided to check dependency count.",
    };
  }

  let pkg: {
    type?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  try {
    pkg = JSON.parse(packageJson) as typeof pkg;
  } catch {
    return {
      id: "DEP-002",
      name: "Minimal Dependencies",
      category: "Dependencies",
      severity: "low",
      passed: false,
      notApplicable: false,
      message: "package.json could not be parsed — unable to verify dependencies.",
    };
  }

  const prodDeps = Object.keys(pkg.dependencies ?? {});
  const devDeps = Object.keys(pkg.devDependencies ?? {});
  const allDeps = [...prodDeps, ...devDeps];

  // Unexpected production dependencies (not in expected/standard list)
  const unexpectedProd = prodDeps.filter(
    (dep) => !EXPECTED_PACKAGES.includes(dep)
  );

  // Check for ESM type field (required by FloMCP generator)
  const hasTypeModule = pkg.type === "module";

  // Score: passes if prod deps are reasonable and type:module is set
  const tooManyDeps = prodDeps.length > MAX_EXPECTED_PROD_DEPS;
  const passed = !tooManyDeps && hasTypeModule;

  return {
    id: "DEP-002",
    name: "Minimal & Correct Dependencies",
    category: "Dependencies",
    severity: "low",
    passed,
    notApplicable: false,
    message: passed
      ? `${prodDeps.length} prod dep(s), ${devDeps.length} dev dep(s) — within expected limits. ESM module type set.`
      : !hasTypeModule
        ? 'package.json missing "type": "module" — required for ESM MCP servers.'
        : `${prodDeps.length} production dependencies (>${MAX_EXPECTED_PROD_DEPS} limit) — consider reducing.`,
    details: unexpectedProd.length > 0
      ? `Unexpected production packages: ${unexpectedProd.join(", ")}`
      : undefined,
    recommendation: passed
      ? undefined
      : !hasTypeModule
        ? 'Add "type": "module" to package.json for ESM compatibility.'
        : `Reduce production dependencies to ${MAX_EXPECTED_PROD_DEPS} or fewer. Unexpected: ${unexpectedProd.join(", ")}`,
  };
}

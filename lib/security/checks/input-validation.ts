/**
 * Security Checks — Input Validation (VAL-001 to VAL-005)
 */

import type { SecurityCheck, CodeFiles } from "../types";
import {
  anyMatch,
  ZOD_IMPORT_PATTERN,
  ZOD_SCHEMA_PATTERNS,
  TS_STRICT_PATTERNS,
  BOUNDARY_CHECK_PATTERNS,
  INPUT_TRIM_PATTERNS,
  REFINE_PATH_SAFETY_PATTERNS,
} from "../patterns";

// ─── VAL-001: JSON Schema Validation (Zod) ───────────────────────────────────

export function checkSchemaValidation(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const hasZodImport = ZOD_IMPORT_PATTERN.test(code);
  const hasZodUsage = anyMatch(ZOD_SCHEMA_PATTERNS, code);

  const passed = hasZodImport && hasZodUsage;

  return {
    id: "VAL-001",
    name: "Input Schema Validation (Zod)",
    category: "Input Validation",
    severity: "critical",
    passed,
    notApplicable: false,
    message: passed
      ? "Zod imported and used for input schema validation."
      : !hasZodImport
        ? "Zod not imported — no schema validation present."
        : "Zod imported but no schema usage (z.object, .parse, .safeParse) detected.",
    recommendation: passed
      ? undefined
      : 'Import Zod and define schemas for every tool parameter. Example: z.object({ name: z.string().trim().min(1) })',
  };
}

// ─── VAL-002: TypeScript Strict Mode ─────────────────────────────────────────

export function checkTypeScriptStrict(files: CodeFiles): SecurityCheck {
  const tsconfig = files.tsconfig ?? "";

  if (!tsconfig) {
    // If no tsconfig provided, check if code itself uses TypeScript features
    const hasTypeAnnotations = /:\s*(?:string|number|boolean|object|unknown|void|Promise)\b/.test(
      files.indexTs
    );
    return {
      id: "VAL-002",
      name: "TypeScript Strict Mode",
      category: "Input Validation",
      severity: "high",
      passed: hasTypeAnnotations,
      notApplicable: !hasTypeAnnotations,
      message: hasTypeAnnotations
        ? "TypeScript type annotations detected — type safety present."
        : "No tsconfig.json provided to verify strict mode.",
      recommendation: hasTypeAnnotations
        ? undefined
        : 'Add tsconfig.json with "strict": true to enable strict TypeScript checking.',
    };
  }

  const hasStrict = anyMatch(TS_STRICT_PATTERNS, tsconfig);

  return {
    id: "VAL-002",
    name: "TypeScript Strict Mode",
    category: "Input Validation",
    severity: "high",
    passed: hasStrict,
    notApplicable: false,
    message: hasStrict
      ? 'TypeScript strict mode enabled ("strict": true in tsconfig.json).'
      : 'TypeScript strict mode is disabled — enables unsafe type coercions.',
    recommendation: hasStrict
      ? undefined
      : 'Set "strict": true in compilerOptions in tsconfig.json.',
  };
}

// ─── VAL-003: Boundary Checking ──────────────────────────────────────────────

export function checkBoundaryChecking(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  // Skip if no Zod (caught by VAL-001)
  const hasZod = ZOD_IMPORT_PATTERN.test(code);
  if (!hasZod) {
    return {
      id: "VAL-003",
      name: "Boundary Checking (min/max)",
      category: "Input Validation",
      severity: "medium",
      passed: false,
      notApplicable: true,
      message: "Zod not detected — boundary checking requires schema validation (VAL-001).",
    };
  }

  const hasBoundaryChecks = anyMatch(BOUNDARY_CHECK_PATTERNS, code);

  return {
    id: "VAL-003",
    name: "Boundary Checking (min/max)",
    category: "Input Validation",
    severity: "medium",
    passed: hasBoundaryChecks,
    notApplicable: false,
    message: hasBoundaryChecks
      ? "Boundary constraints (min, max, .finite(), .url(), etc.) detected on schema fields."
      : "No boundary constraints found on schema fields.",
    recommendation: hasBoundaryChecks
      ? undefined
      : "Add Zod constraints: z.string().min(1).max(1000), z.number().finite().min(0), z.string().url(), etc.",
  };
}

// ─── VAL-004: Input Sanitization ─────────────────────────────────────────────

export function checkInputSanitization(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const hasTrim = anyMatch(INPUT_TRIM_PATTERNS, code);

  // Detect real file-system operations by requiring an actual fs/path module
  // import OR an unambiguous fs.* call — NOT just the word "path." which would
  // match variable names like "expressionPath." in math servers (false positive).
  const hasFileOps =
    /\brequire\s*\(\s*['"](?:fs|path)(?:\/promises)?['"]\s*\)/i.test(code) ||
    /\bimport\b[^'"]*from\s+['"](?:fs|path)(?:\/promises)?['"]/i.test(code) ||
    /\bfs\.(?:readFile|writeFile|mkdir|rmdir|exists|stat|readdir|createReadStream|access)\b/.test(code);

  const hasPathSafety = !hasFileOps || anyMatch(REFINE_PATH_SAFETY_PATTERNS, code);

  const passed = hasTrim && hasPathSafety;

  let message: string;
  let recommendation: string | undefined;

  if (!hasTrim && hasFileOps && !hasPathSafety) {
    message = "No .trim() on string inputs and missing path traversal protection.";
    recommendation =
      "Use z.string().trim() for string inputs. Add .refine(s => !s.includes('..'), 'No path traversal') for file path params.";
  } else if (!hasTrim) {
    message = "String inputs are not trimmed — leading/trailing whitespace can cause unexpected behaviour.";
    recommendation = "Add .trim() to all z.string() schemas: z.string().trim().";
  } else if (hasFileOps && !hasPathSafety) {
    message = "File system operations detected without path traversal protection.";
    recommendation =
      "Add .refine(s => !s.includes('..') && !require('path').isAbsolute(s), 'Invalid path') to file path parameters.";
  } else {
    message = "String inputs trimmed and path traversal protection in place.";
  }

  return {
    id: "VAL-004",
    name: "Input Sanitization",
    category: "Input Validation",
    severity: "medium",
    passed,
    notApplicable: false,
    message,
    recommendation,
  };
}

// ─── VAL-005: Required Fields Enforced ───────────────────────────────────────

export function checkRequiredFields(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  // Look for z.string().optional() or z.number().optional() WITHOUT a .default()
  // Truly optional fields should have a .default() to avoid undefined handling issues
  const OPTIONAL_WITHOUT_DEFAULT = /z\.(string|number|boolean)\s*\(\s*\)\.optional\s*\(\s*\)(?!\.default)/g;
  const optionalWithoutDefault = code.match(OPTIONAL_WITHOUT_DEFAULT) ?? [];

  // Check for Zod object shapes defining inputs — good sign
  const hasZodShape = /z\.object\s*\(\s*\{/.test(code) || /server\.tool\s*\(/.test(code);

  // This check passes if:
  //   1. Zod shapes are used (required fields are implicit in Zod unless .optional())
  //   2. Any optional fields have .default() to guarantee a safe value
  const passed = hasZodShape && optionalWithoutDefault.length === 0;

  return {
    id: "VAL-005",
    name: "Required Fields Enforced",
    category: "Input Validation",
    severity: "low",
    passed,
    notApplicable: !hasZodShape,
    message: !hasZodShape
      ? "No Zod tool shapes detected — required field enforcement not verified."
      : passed
        ? "Required fields enforced via Zod shapes; optional fields include safe defaults."
        : `${optionalWithoutDefault.length} optional field(s) lack .default() — may cause undefined errors at runtime.`,
    recommendation: passed || !hasZodShape
      ? undefined
      : "For optional parameters always add .default(): z.string().optional().default('') or z.number().optional().default(0).",
  };
}

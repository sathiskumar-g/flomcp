/**
 * Security Checks — Command Execution (CMD-001 to CMD-003)
 */

import type { SecurityCheck, CodeFiles } from "../types";
import {
  anyMatch,
  DANGEROUS_EXEC_PATTERNS,
  EVAL_PATTERNS,
  TIMEOUT_PATTERNS,
  HTTP_CALL_PATTERNS,
} from "../patterns";

/** Returns true if the code uses child_process / exec / spawn. */
function hasProcessExec(code: string): boolean {
  return anyMatch(DANGEROUS_EXEC_PATTERNS, code);
}

// ─── CMD-001: No shell:true in exec ──────────────────────────────────────────

export function checkNoShellExecution(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const hasChildProcess = /child_process|require\s*\(\s*['"]child_process['"]\s*\)/.test(code);

  if (!hasChildProcess) {
    return {
      id: "CMD-001",
      name: "No Shell Execution (shell:true)",
      category: "Command Execution",
      severity: "high",
      passed: true,
      notApplicable: true,
      message: "No child_process usage detected — shell execution check not applicable.",
    };
  }

  const hasDangerousShell = anyMatch(
    [/exec\s*\([^)]*shell\s*:\s*true/, /spawn\s*\([^)]*shell\s*:\s*true/],
    code
  );

  const hasExecSync = /execSync\s*\(|spawnSync\s*\(/.test(code);

  const passed = !hasDangerousShell && !hasExecSync;

  return {
    id: "CMD-001",
    name: "No Shell Execution (shell:true)",
    category: "Command Execution",
    severity: "high",
    passed,
    notApplicable: false,
    message: passed
      ? "child_process used without shell:true — command injection risk mitigated."
      : hasDangerousShell
        ? "exec/spawn called with shell:true — allows shell injection attacks."
        : "execSync/spawnSync detected — synchronous execution blocks the event loop.",
    recommendation: passed
      ? undefined
      : hasDangerousShell
        ? "Never use { shell: true }. Pass arguments as an array to spawn(['cmd', [arg1, arg2]])."
        : "Replace execSync/spawnSync with async exec/spawn to avoid blocking the event loop.",
  };
}

// ─── CMD-002: No eval / Function Constructor ──────────────────────────────────

export function checkNoEval(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const foundEval = EVAL_PATTERNS.map((p) => ({
    pattern: p.source,
    found: new RegExp(p.source, p.flags).test(code),
  })).filter((r) => r.found);

  const passed = foundEval.length === 0;

  return {
    id: "CMD-002",
    name: "No eval / Dynamic Code Execution",
    category: "Command Execution",
    severity: "low",
    passed,
    notApplicable: false,
    message: passed
      ? "No eval(), new Function(), or dynamic code execution detected."
      : `Dynamic code execution detected: ${foundEval.map((r) => r.pattern).join(", ")}`,
    recommendation: passed
      ? undefined
      : "Remove all eval(), new Function(), setTimeout with string args, and vm.runInContext() calls. These allow arbitrary code execution.",
  };
}

// ─── CMD-003: Execution Timeouts ─────────────────────────────────────────────

export function checkExecutionTimeouts(files: CodeFiles): SecurityCheck {
  const code = files.indexTs;

  const makesHttp = anyMatch(HTTP_CALL_PATTERNS, code);
  const hasChildProcess = /child_process/.test(code);

  // If no async operations that could hang, N/A
  if (!makesHttp && !hasChildProcess) {
    return {
      id: "CMD-003",
      name: "Execution Timeouts",
      category: "Command Execution",
      severity: "medium",
      passed: true,
      notApplicable: true,
      message: "No HTTP or process execution detected — timeout enforcement not applicable.",
    };
  }

  const hasTimeout = anyMatch(TIMEOUT_PATTERNS, code);

  // Specifically check for HTTP calls with timeout
  const hasFetchTimeout =
    /fetchWithTimeout\s*\(/.test(code) ||
    /AbortSignal\.timeout\s*\(/.test(code) ||
    /AbortController\b/.test(code);

  // Check for child_process timeout
  const hasProcessTimeout = hasChildProcess
    ? /timeout\s*[:=]\s*\d/.test(code) || /setTimeout\s*\(\s*(?!["'`])/.test(code)
    : true; // Not required if no child process

  const passed = (makesHttp ? hasFetchTimeout : true) && (hasChildProcess ? hasProcessTimeout : true);

  return {
    id: "CMD-003",
    name: "Execution Timeouts",
    category: "Command Execution",
    severity: "medium",
    passed,
    notApplicable: false,
    message: passed
      ? "Timeout enforcement present for async operations."
      : makesHttp && !hasFetchTimeout
        ? "HTTP calls found without timeout — requests can hang indefinitely."
        : "Child process calls lack timeout — processes can hang indefinitely.",
    recommendation: passed
      ? undefined
      : makesHttp
        ? "Use fetchWithTimeout() or AbortSignal.timeout(10000) for all fetch calls."
        : "Add a timeout to child_process calls: exec(cmd, { timeout: 10000 }, callback).",
  };
}

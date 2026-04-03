/**
 * Credit estimation utilities for the FloMCP 3-tier pricing model.
 *
 * Tier is determined solely by TOOL COUNT and CONTENT size.
 * Description and API usage are FREE — they never affect tier cost.
 *
 * Tier 1 — Simple   (1 credit): ≤3 tools  AND combined content ≤ 2,000 chars
 * Tier 2 — Complex  (2 credits): ≤10 tools AND combined content ≤ 3,000 chars
 *                                 (i.e. >3 tools OR content >2,000 → at least Tier 2)
 * Tier 3 — Premium  (3 credits): ≤20 tools AND combined content ≤ 4,000 chars
 *                                 (i.e. >10 tools OR content >3,000 → Tier 3)
 *
 * Hard cap (422 error): >20 tools, description >2,000 chars,
 *                       single resource >2,000 chars,
 *                       single prompt >2,000 chars,
 *                       total content >4,000 chars.
 *
 * Tier 3 is evaluated first — a Premium generation is never downgraded.
 */

import type {
  ToolDefinition,
  ResourceDefinition,
  PromptDefinition,
  ApiConfig,
} from "@/lib/stores/generator-store";

// ─── Hard limits (enforced server-side, surfaced client-side) ─────────────────

/** Maximum tools allowed per server. >20 → 422 error. */
export const MAX_TOOLS = 20;

/** Maximum description length in characters. */
export const MAX_DESCRIPTION_CHARS = 2_000;

/** Maximum content length per individual resource. */
export const MAX_SINGLE_RESOURCE_CHARS = 2_000;

/** Maximum content length per individual prompt. */
export const MAX_SINGLE_PROMPT_CHARS = 2_000;

/** Maximum combined content length across all resources + prompts. */
export const MAX_TOTAL_CONTENT_CHARS = 4_000;

// ─── Tier thresholds (tools + content only — description and API are free) ────

/** Max tools for Tier 1 (Simple). >3 tools → at least Tier 2. */
export const TIER1_MAX_TOOLS = 3;
/** Max combined content chars for Tier 1 (Simple). >2,000 → at least Tier 2. */
export const TIER1_MAX_CONTENT_CHARS = 2_000;

/** Max tools for Tier 2 (Complex). >10 tools → Tier 3. */
export const TIER2_MAX_TOOLS = 10;
/** Max combined content chars for Tier 2 (Complex). >3,000 → Tier 3. */
export const TIER2_MAX_CONTENT_CHARS = 3_000;

// ─── Other ────────────────────────────────────────────────────────────────────

export const API_KEYWORDS = [
  "fetch", "http", "https", "api", "endpoint", "url", "webhook",
  "auth", "token", "oauth", "rest", "graphql", "request", "bearer",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreditEstimate {
  /** How many credits this generation will cost. */
  cost: 1 | 2 | 3;
  /** Numeric tier (same as cost; kept for explicit intent). */
  tier: 1 | 2 | 3;
  /** Human-readable tier label. */
  tierLabel: "Simple" | "Complex" | "Premium";
  /** True when cost > 1 (convenience alias kept for backward compatibility). */
  isComplex: boolean;
  /** Human-readable reasons driving the cost (empty for Tier 1). */
  reasons: string[];
  /** Total chars across all resource + prompt content fields. */
  totalContentChars: number;
}

export interface InputLimitError {
  field: "tools" | "description" | "resource" | "prompt" | "content";
  code:
    | "TOOLS_LIMIT_EXCEEDED"
    | "DESCRIPTION_LIMIT_EXCEEDED"
    | "RESOURCE_CONTENT_LIMIT_EXCEEDED"
    | "PROMPT_CONTENT_LIMIT_EXCEEDED"
    | "TOTAL_CONTENT_LIMIT_EXCEEDED";
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if any tool name or description contains an API-related keyword.
 */
export function detectApiUsage(tools: ToolDefinition[]): boolean {
  return tools.some((tool) => {
    const text = `${tool.name} ${tool.description}`.toLowerCase();
    return API_KEYWORDS.some((kw) => text.includes(kw));
  });
}

/**
 * Validates hard input limits.
 * Returns an array of violations — empty array means all clear.
 * These are enforced server-side (422) and shown client-side before generate.
 */
export function validateInputLimits(config: {
  tools: ToolDefinition[];
  resources: ResourceDefinition[];
  prompts: PromptDefinition[];
  description: string;
}): InputLimitError[] {
  const { tools, resources, prompts, description } = config;
  const errors: InputLimitError[] = [];

  // Tools hard cap
  if (tools.length > MAX_TOOLS) {
    errors.push({
      field: "tools",
      code: "TOOLS_LIMIT_EXCEEDED",
      message: `Too many tools. Maximum is ${MAX_TOOLS} tools per server — you have ${tools.length}. Remove ${tools.length - MAX_TOOLS} tool${tools.length - MAX_TOOLS > 1 ? "s" : ""} to continue.`,
    });
  }

  // Description hard cap
  if (description.length > MAX_DESCRIPTION_CHARS) {
    errors.push({
      field: "description",
      code: "DESCRIPTION_LIMIT_EXCEEDED",
      message: `Description is too long. Maximum is ${MAX_DESCRIPTION_CHARS.toLocaleString()} characters — you have ${description.length.toLocaleString()}. Trim ${(description.length - MAX_DESCRIPTION_CHARS).toLocaleString()} characters from your description.`,
    });
  }

  // Per-resource content cap
  for (const resource of resources) {
    const len = resource.content?.length ?? 0;
    if (len > MAX_SINGLE_RESOURCE_CHARS) {
      errors.push({
        field: "resource",
        code: "RESOURCE_CONTENT_LIMIT_EXCEEDED",
        message: `Resource "${resource.name}" is too long (${len.toLocaleString()} chars). Maximum is ${MAX_SINGLE_RESOURCE_CHARS.toLocaleString()} characters per resource. Split it into multiple resources or trim the content.`,
      });
    }
  }

  // Per-prompt content cap
  for (const prompt of prompts) {
    const len = prompt.content?.length ?? 0;
    if (len > MAX_SINGLE_PROMPT_CHARS) {
      errors.push({
        field: "prompt",
        code: "PROMPT_CONTENT_LIMIT_EXCEEDED",
        message: `Prompt "${prompt.name}" is too long (${len.toLocaleString()} chars). Maximum is ${MAX_SINGLE_PROMPT_CHARS.toLocaleString()} characters per prompt. Trim the content or split it across multiple prompts.`,
      });
    }
  }

  // Total combined content cap
  const totalContent =
    resources.reduce((s, r) => s + (r.content?.length ?? 0), 0) +
    prompts.reduce((s, p) => s + (p.content?.length ?? 0), 0);
  if (totalContent > MAX_TOTAL_CONTENT_CHARS) {
    errors.push({
      field: "content",
      code: "TOTAL_CONTENT_LIMIT_EXCEEDED",
      message: `Total embedded content is too large (${totalContent.toLocaleString()} chars). Maximum is ${MAX_TOTAL_CONTENT_CHARS.toLocaleString()} characters across all resources and prompts combined. Reduce content by ${(totalContent - MAX_TOTAL_CONTENT_CHARS).toLocaleString()} characters.`,
    });
  }

  return errors;
}

/**
 * Estimates the credit cost for a generation based on wizard config.
 */
export function estimateCredits(config: {
  tools: ToolDefinition[];
  resources: ResourceDefinition[];
  prompts: PromptDefinition[];
  apiConfig: ApiConfig;
  description?: string;
}): CreditEstimate {
  const { tools, resources, prompts, apiConfig, description = "" } = config;

  const toolCount = tools.length;
  const hasApi    = apiConfig.enabled || detectApiUsage(tools);
  const descLen   = description.length;

  const resourceChars     = resources.reduce((s, r) => s + (r.content?.length ?? 0), 0);
  const promptChars       = prompts.reduce((s, p) => s + (p.content?.length ?? 0), 0);
  const totalContentChars = resourceChars + promptChars;

  // ── Reasons (shown in UI badge) ───────────────────────────────────────────
  const reasons: string[] = [];
  if (toolCount > TIER1_MAX_TOOLS)         reasons.push(`${toolCount} tools`);
  if (resources.length >= 1)               reasons.push(`${resources.length} resource${resources.length > 1 ? "s" : ""}`);
  if (prompts.length >= 1)                 reasons.push(`${prompts.length} prompt${prompts.length > 1 ? "s" : ""}`);
  if (totalContentChars > TIER1_MAX_CONTENT_CHARS)
                                           reasons.push(`${totalContentChars.toLocaleString()} chars content`);

  // ── Tier 3: >10 tools OR content >3,000 chars ────────────────────────────
  const isTier3 = toolCount > TIER2_MAX_TOOLS || totalContentChars > TIER2_MAX_CONTENT_CHARS;
  if (isTier3) {
    return { cost: 3, tier: 3, tierLabel: "Premium", isComplex: true, reasons, totalContentChars };
  }

  // ── Tier 1: ≤3 tools AND content ≤2,000 ─────────────────────────────────
  const isTier1 = toolCount <= TIER1_MAX_TOOLS && totalContentChars <= TIER1_MAX_CONTENT_CHARS;
  if (isTier1) {
    return { cost: 1, tier: 1, tierLabel: "Simple", isComplex: false, reasons: [], totalContentChars };
  }

  // ── Tier 2: everything in between ────────────────────────────────────────
  return { cost: 2, tier: 2, tierLabel: "Complex", isComplex: true, reasons, totalContentChars };
}

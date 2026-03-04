/**
 * Credit estimation utilities for the ClarFlo / FloMCP pricing model.
 *
 * Complexity rule: 1 credit by default.
 * 2 credits only when ALL four conditions are met:
 *   1. ≥5 tools
 *   2. ≥1 resource
 *   3. ≥1 prompt
 *   4. API integration detected (enabled in config OR keyword in tool names/descriptions)
 */

import type {
  ToolDefinition,
  ResourceDefinition,
  PromptDefinition,
  ApiConfig,
} from "@/lib/stores/generator-store";

// ─── Constants ────────────────────────────────────────────────────────────────

export const API_KEYWORDS = [
  "fetch", "http", "https", "api", "endpoint", "url", "webhook",
  "auth", "token", "oauth", "rest", "graphql", "request", "bearer",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreditEstimate {
  /** How many credits this generation will cost. */
  cost: 1 | 2;
  /** Whether all four complexity conditions were met. */
  isComplex: boolean;
  /** Human-readable reasons driving the complexity (empty for standard). */
  reasons: string[];
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
 * Estimates the credit cost for a generation based on wizard config.
 */
export function estimateCredits(config: {
  tools: ToolDefinition[];
  resources: ResourceDefinition[];
  prompts: PromptDefinition[];
  apiConfig: ApiConfig;
}): CreditEstimate {
  const { tools, resources, prompts, apiConfig } = config;
  const reasons: string[] = [];

  const hasEnoughTools = tools.length >= 5;
  const hasResources = resources.length >= 1;
  const hasPrompts = prompts.length >= 1;
  const hasApi = apiConfig.enabled || detectApiUsage(tools);

  if (hasEnoughTools) reasons.push(`${tools.length} tools`);
  if (hasResources) reasons.push(`${resources.length} resource${resources.length > 1 ? "s" : ""}`);
  if (hasPrompts) reasons.push(`${prompts.length} prompt${prompts.length > 1 ? "s" : ""}`);
  if (hasApi) reasons.push("API integration");

  const isComplex = hasEnoughTools && hasResources && hasPrompts && hasApi;

  return {
    cost: isComplex ? 2 : 1,
    isComplex,
    reasons: isComplex ? reasons : [],
  };
}

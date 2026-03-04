/**
 * Mock Test Runner — Task 4.1.2
 *
 * Parses MCP tool definitions from generated TypeScript source code
 * using regex / bracket-balancing (no AST — zero extra deps).
 *
 * Contract:
 *  - NEVER executes user code
 *  - NEVER makes network requests
 *  - Returns mock / expected outputs based on schema types
 */

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ParsedParam {
  name: string;
  /** Normalised base type: string | number | boolean | array | enum | object | unknown */
  zodType: "string" | "number" | "boolean" | "array" | "enum" | "object" | "unknown";
  required: boolean;
  description?: string;
  enumValues?: string[];
}

export interface ParsedTool {
  name: string;
  description: string;
  parameters: ParsedParam[];
}

export interface MockTestResult {
  toolName: string;
  inputValid: boolean;
  validationErrors: string[];
  mockResponse: unknown;
  /** URL / API endpoint this tool would call (if detectable) */
  wouldCall?: string;
  /** Short summary note */
  notes: string;
}

// ─── Tool parser ─────────────────────────────────────────────────────────────

/**
 * Extract the balanced content between the first `(` after `pos` and its
 * matching `)`. Returns the inner string (without the outer parens) or null.
 */
function extractBalancedParens(src: string, openPos: number): string | null {
  let depth = 0;
  let start = -1;
  for (let i = openPos; i < src.length; i++) {
    if (src[i] === "(") {
      depth++;
      if (start === -1) start = i;
    } else if (src[i] === ")") {
      depth--;
      if (depth === 0 && start !== -1) {
        return src.slice(start + 1, i);
      }
    }
  }
  return null;
}

/**
 * Extract the balanced content of the first `{` after `pos` and its matching `}`.
 */
function extractBalancedBraces(src: string, startPos: number): string | null {
  let depth = 0;
  let start = -1;
  for (let i = startPos; i < src.length; i++) {
    if (src[i] === "{") {
      depth++;
      if (start === -1) start = i;
    } else if (src[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        return src.slice(start + 1, i);
      }
    }
  }
  return null;
}

/**
 * Parse a quoted string literal (single, double, or backtick) starting at pos.
 * Returns [value, endIndex] or null.
 */
function parseStringLiteral(src: string, pos: number): [string, number] | null {
  // Skip leading whitespace
  while (pos < src.length && /\s/.test(src[pos])) pos++;
  const q = src[pos];
  if (q !== '"' && q !== "'" && q !== "`") return null;
  let val = "";
  let i = pos + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") { val += src[i + 1] ?? ""; i += 2; continue; }
    if (c === q) return [val, i + 1];
    val += c;
    i++;
  }
  return null;
}

/**
 * Parse Zod schema parameters from the inner body of the schema object literal.
 * e.g.  `city: z.string().trim().describe("City name"), count: z.number().finite()`
 */
function parseSchemaParams(schemaBody: string): ParsedParam[] {
  const params: ParsedParam[] = [];

  // Each param starts at a word boundary followed by `: z.`
  const PARAM_RE = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*z\.(string|number|boolean|array|object|enum)\b/g;
  let match: RegExpExecArray | null;

  while ((match = PARAM_RE.exec(schemaBody)) !== null) {
    const paramName = match[1];
    const baseType = match[2] as ParsedParam["zodType"];

    // Grab the full chain text for this param (up to the next comma at depth 0)
    const chainStart = match.index + match[0].length;
    let chainEnd = chainStart;
    let depth = 0;
    for (let i = chainStart; i < schemaBody.length; i++) {
      const c = schemaBody[i];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (c === "," && depth === 0) { chainEnd = i; break; }
      chainEnd = i + 1;
    }
    const chain = schemaBody.slice(chainStart, chainEnd);

    const required = !chain.includes(".optional()");

    // Extract .describe("...") value
    const descMatch = chain.match(/\.describe\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/);
    const description = descMatch ? descMatch[1] : undefined;

    // Extract enum values: z.enum(["a", "b", ...])
    let enumValues: string[] | undefined;
    if (baseType === "enum") {
      const enumBody = extractBalancedParens(schemaBody, match.index + match[0].indexOf("enum"));
      if (enumBody) {
        enumValues = [...enumBody.matchAll(/["'`]([^"'`]*)["'`]/g)].map((m) => m[1]);
      }
    }

    params.push({ name: paramName, zodType: baseType, required, description, enumValues });
  }

  return params;
}

/**
 * Parse all `server.tool(...)` definitions from a generated src/index.ts.
 */
export function parseTools(indexTs: string): ParsedTool[] {
  const tools: ParsedTool[] = [];
  const TOOL_START_RE = /server\.tool\s*\(/g;
  let m: RegExpExecArray | null;

  while ((m = TOOL_START_RE.exec(indexTs)) !== null) {
    const argsBody = extractBalancedParens(indexTs, m.index + m[0].length - 1);
    if (!argsBody) continue;

    // Arg 1: tool name (string literal)
    const nameResult = parseStringLiteral(argsBody, 0);
    if (!nameResult) continue;
    const [toolName, afterName] = nameResult;

    // Skip comma
    let pos = afterName;
    while (pos < argsBody.length && /[\s,]/.test(argsBody[pos])) pos++;

    // Arg 2: description (string literal)
    const descResult = parseStringLiteral(argsBody, pos);
    if (!descResult) continue;
    const [description, afterDesc] = descResult;

    // Skip comma + whitespace to find the opening { of the schema object
    pos = afterDesc;
    while (pos < argsBody.length && /[\s,]/.test(argsBody[pos])) pos++;

    // Arg 3: schema object
    const schemaBody = extractBalancedBraces(argsBody, pos);
    const parameters = schemaBody ? parseSchemaParams(schemaBody) : [];

    tools.push({ name: toolName, description, parameters });
  }

  return tools;
}

// ─── Input validator ──────────────────────────────────────────────────────────

function validateInput(
  params: ParsedParam[],
  input: Record<string, unknown>
): string[] {
  const errors: string[] = [];

  for (const p of params) {
    const val = input[p.name];

    // Required check
    if (p.required && (val === undefined || val === null || val === "")) {
      errors.push(`"${p.name}" is required`);
      continue;
    }
    if (!p.required && (val === undefined || val === null || val === "")) continue;

    // Type check
    switch (p.zodType) {
      case "string":
        if (typeof val !== "string") errors.push(`"${p.name}" must be a string`);
        break;
      case "number":
        if (typeof val !== "number" && isNaN(Number(val)))
          errors.push(`"${p.name}" must be a number`);
        break;
      case "boolean":
        if (val !== true && val !== false && val !== "true" && val !== "false")
          errors.push(`"${p.name}" must be true or false`);
        break;
      case "array":
        if (!Array.isArray(val)) errors.push(`"${p.name}" must be an array`);
        break;
      case "enum":
        if (p.enumValues && !p.enumValues.includes(String(val)))
          errors.push(
            `"${p.name}" must be one of: ${p.enumValues.map((v) => `"${v}"`).join(", ")}`
          );
        break;
    }
  }

  // Warn about unknown keys
  for (const key of Object.keys(input)) {
    if (!params.find((p) => p.name === key)) {
      errors.push(`"${key}" is not a recognised parameter`);
    }
  }

  return errors;
}

// ─── Mock response generator ──────────────────────────────────────────────────

function mockValueForParam(p: ParsedParam, inputVal: unknown): unknown {
  if (inputVal !== undefined && inputVal !== null && inputVal !== "") return inputVal;
  switch (p.zodType) {
    case "string":  return p.enumValues ? p.enumValues[0] : "sample_value";
    case "number":  return 42;
    case "boolean": return true;
    case "array":   return ["item1", "item2"];
    case "enum":    return p.enumValues?.[0] ?? "option1";
    case "object":  return {};
    default:        return null;
  }
}

function buildMockResponse(tool: ParsedTool, input: Record<string, unknown>): unknown {
  // Heuristic: guess a plausible response shape based on tool name + param names
  const name = tool.name.toLowerCase();

  if (/^(get|fetch|list|search|find|query|read|show|retrieve)/.test(name)) {
    return {
      success: true,
      data: tool.parameters.reduce<Record<string, unknown>>((acc, p) => {
        acc[p.name] = mockValueForParam(p, input[p.name]);
        return acc;
      }, {}),
    };
  }

  if (/^(create|add|insert|post|new)/.test(name)) {
    return { success: true, id: "mock-id-" + Math.random().toString(36).slice(2, 8), created: true };
  }

  if (/^(update|edit|patch|modify|set)/.test(name)) {
    return { success: true, updated: true };
  }

  if (/^(delete|remove|destroy)/.test(name)) {
    return { success: true, deleted: true };
  }

  if (/(calc|evaluate|compute|solve|convert|transform|parse|format)/.test(name)) {
    return { success: true, result: "42" };
  }

  // Generic fallback
  return { success: true, message: `Mock response from ${tool.name}` };
}

// ─── API call detector ────────────────────────────────────────────────────────

function detectWouldCall(indexTs: string, toolName: string, input: Record<string, unknown>): string | undefined {
  // Find the tool handler body
  const toolIdx = indexTs.indexOf(`"${toolName}"`);
  if (toolIdx === -1) return undefined;

  // Find the async handler following the tool registration
  const afterTool = indexTs.slice(toolIdx);
  const fetchMatch = afterTool.match(/fetch(?:WithTimeout)?\s*\(\s*[`"']([^`"'${}]*)\$?\{?([^}`"']*)\}?([^`"']*)[`"']/);
  if (!fetchMatch) return undefined;

  // Reconstruct URL with input values substituted
  let url = (fetchMatch[1] ?? "") + (fetchMatch[2] ? `{${fetchMatch[2]}}` : "") + (fetchMatch[3] ?? "");

  // Substitute known input keys
  for (const [key, val] of Object.entries(input)) {
    url = url.replace(new RegExp(`\\$\\{[^}]*${key}[^}]*\\}`, "g"), String(val));
    url = url.replace(new RegExp(`\\$\\{${key}\\}`, "g"), String(val));
  }

  return url.trim() || undefined;
}

// ─── Main entry ───────────────────────────────────────────────────────────────

/**
 * Run a mock test for a single tool invocation.
 * Never executes code — purely static analysis + mock response generation.
 */
export function runMockTest(
  indexTs: string,
  toolName: string,
  rawInput: Record<string, unknown>
): MockTestResult {
  const tools = parseTools(indexTs);
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    return {
      toolName,
      inputValid: false,
      validationErrors: [`Tool "${toolName}" not found in generated code`],
      mockResponse: null,
      notes: "Tool definition could not be located in src/index.ts.",
    };
  }

  const validationErrors = validateInput(tool.parameters, rawInput);
  const inputValid = validationErrors.length === 0;
  const mockResponse = inputValid ? buildMockResponse(tool, rawInput) : null;
  const wouldCall = detectWouldCall(indexTs, toolName, rawInput);

  const notes = inputValid
    ? `Input is valid against the Zod schema. This is a MOCK response — no code was executed.`
    : `Input has ${validationErrors.length} validation error(s). Fix them to see the mock response.`;

  return { toolName, inputValid, validationErrors, mockResponse, wouldCall, notes };
}

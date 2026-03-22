/**
 * lib/context/fetch.ts
 *
 * SSRF-safe server-side API documentation fetcher.
 * ⚠️  NEVER import this from any client component — server-side only.
 *
 * Security guarantees:
 *  - Validates URL scheme (HTTP/HTTPS only)
 *  - Blocks all private / reserved IP ranges after DNS resolution
 *  - 5-second request timeout via AbortSignal
 *  - 100KB maximum response body (hard cap, never buffered beyond)
 *  - Output truncated to 15k chars before injection into Claude context
 *
 * Supported doc formats:
 *  - OpenAPI 3.x / Swagger 2.x JSON → structured endpoint summary
 *  - HTML documentation pages → stripped text extraction
 *  - GitHub repo/blob URLs → redirect to raw GitHub content
 *  - Plain text / Markdown → passthrough with truncation
 */

import { lookup } from "node:dns/promises";

// ─── Public result type ────────────────────────────────────────────────────────

export interface FetchDocResult {
  /** Processed, truncated textual content ready for Claude context injection */
  content: string;
  /** Source type detected */
  type: "openapi" | "html" | "text" | "github";
  /** Extracted API/page title, if available */
  title?: string;
  /** Number of parsed API endpoints (OpenAPI/Swagger only) */
  endpointCount?: number;
  /** Whether content was truncated to fit the character limit */
  truncated: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS  = 5_000;   // 5 seconds
const MAX_BODY_BYTES    = 100_000;  // 100 KB max response body
const MAX_OUTPUT_CHARS  = 15_000;   // Max chars injected into Claude context
const DNS_TIMEOUT_MS    = 3_000;   // DNS resolution timeout

// ─── SSRF protection ───────────────────────────────────────────────────────────

/** IPv4 and IPv6 private / reserved / link-local address patterns */
const PRIVATE_IP_PATTERNS: RegExp[] = [
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,                            // RFC 1918 class A
  /^172\.(1[6-9]|2\d|30|31)\.\d{1,3}\.\d{1,3}$/,               // RFC 1918 class B
  /^192\.168\.\d{1,3}\.\d{1,3}$/,                                // RFC 1918 class C
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,                           // Loopback
  /^0\.0\.0\.0$/,                                                 // Unspecified
  /^169\.254\.\d{1,3}\.\d{1,3}$/,                                // Link-local + cloud metadata (AWS 169.254.169.254)
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // RFC 6598 shared address space
  /^::1$/,                                                        // IPv6 loopback
  /^fc[0-9a-f]{2}:/i,                                            // IPv6 unique local fc00::/7
  /^fd[0-9a-f]{2}:/i,                                            // IPv6 unique local fd00::/8
  /^fe80:/i,                                                      // IPv6 link-local
  /^::ffff:/i,                                                    // IPv4-mapped — will recheck embedded IPv4
];

/** Hostnames that must never be fetched regardless of their resolved IPs */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",   // GCP instance metadata
  "instance-data",              // GCP alt
  "169.254.169.254",            // IMDSv1 (AWS / Azure / DigitalOcean)
  "fd00:ec2::254",              // IMDSv2 IPv6
]);

function isPrivateAddress(addr: string): boolean {
  // Check IPv4-mapped IPv6 (::ffff:10.0.0.1) by extracting embedded IPv4
  const ipv4Mapped = addr.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (ipv4Mapped) return isPrivateAddress(ipv4Mapped[1]);
  return PRIVATE_IP_PATTERNS.some((re) => re.test(addr));
}

/**
 * Resolve hostname and assert none of its addresses fall in a private range.
 * Throws a sanitized error on any SSRF risk or DNS failure.
 */
async function assertSafeHostname(hostname: string): Promise<void> {
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    throw new Error("Blocked hostname");
  }

  // If hostname is a bare IP literal, check immediately without DNS
  if (/^[\d.:]+$/.test(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error("Blocked: private IP address");
    return;
  }

  let addresses: string[];
  try {
    const entries = await Promise.race<{ address: string; family: number }[]>([
      lookup(hostname, { all: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DNS timeout")), DNS_TIMEOUT_MS)
      ),
    ]);
    addresses = entries.map((e) => e.address);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("Blocked")) throw err as Error;
    throw new Error("Could not resolve hostname");
  }

  if (addresses.length === 0) {
    throw new Error("Hostname resolves to no addresses");
  }

  for (const addr of addresses) {
    if (isPrivateAddress(addr)) {
      throw new Error("Blocked: resolves to private IP");
    }
  }
}

// ─── GitHub URL transformer ────────────────────────────────────────────────────

/**
 * Convert a github.com browsing URL to its raw.githubusercontent.com equivalent.
 * Returns the original URL string unchanged if no transform applies.
 */
function transformGithubUrl(url: URL): string {
  if (url.hostname !== "github.com") return url.toString();

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return url.toString();

  const [owner, repo, type, ...rest] = parts;

  if (parts.length === 2) {
    // github.com/owner/repo → fetch default README (try main branch)
    return `https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`;
  }

  if (type === "blob" && rest.length >= 1) {
    // github.com/owner/repo/blob/branch/path → raw file
    return `https://raw.githubusercontent.com/${owner}/${repo}/${rest.join("/")}`;
  }

  if (type === "tree" && rest.length >= 1) {
    // github.com/owner/repo/tree/branch/dir → README in that dir
    return `https://raw.githubusercontent.com/${owner}/${repo}/${rest.join("/")}/README.md`;
  }

  return url.toString();
}

// ─── Content-type detection ─────────────────────────────────────────────────────

type ContentKind = "json" | "html" | "text";

function detectContentKind(contentType: string, bodyStart: string): ContentKind {
  const ct = contentType.toLowerCase();
  if (ct.includes("application/json") || ct.includes("+json")) return "json";
  if (ct.includes("text/html")) return "html";

  // Sniff first 512 bytes when content-type is absent or ambiguous
  const s = bodyStart.trimStart().slice(0, 512);
  if (s.startsWith("{") || s.startsWith("[")) return "json";
  if (/<html[\s>]/i.test(s) || /<!doctype\s+html/i.test(s)) return "html";

  return "text";
}

// ─── OpenAPI / Swagger parser ───────────────────────────────────────────────────

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOpenAPISpec(obj: Record<string, any>): FetchDocResult {
  const info = obj.info ?? {};
  const title: string = typeof info.title === "string" ? info.title : "API";
  const version: string = typeof info.version === "string" ? info.version : "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paths = (obj.paths ?? {}) as Record<string, Record<string, any>>;
  const endpointLines: string[] = [];

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, op] of Object.entries(methods ?? {})) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      const opObj = op as Record<string, unknown> ?? {};
      const summary = typeof opObj.summary === "string" ? opObj.summary : "";
      const opId = typeof opObj.operationId === "string" ? opObj.operationId : "";
      const label = summary || opId;
      endpointLines.push(
        `  ${method.toUpperCase()} ${path}${label ? ` — ${label}` : ""}`
      );
    }
  }

  const lines: string[] = [`## ${title}${version ? ` (v${version})` : ""}`];

  if (typeof info.description === "string" && info.description.trim()) {
    lines.push(info.description.trim().slice(0, 500));
  }

  // Base server URL(s)
  if (Array.isArray(obj.servers) && obj.servers.length > 0) {
    const baseUrl = (obj.servers[0] as { url?: string }).url;
    if (baseUrl) lines.push(`\nBase URL: ${baseUrl}`);
  } else if (typeof obj.host === "string") {
    // Swagger 2.0 style
    const scheme = Array.isArray(obj.schemes) ? obj.schemes[0] : "https";
    lines.push(`\nBase URL: ${scheme}://${obj.host}${obj.basePath ?? ""}`);
  }

  if (endpointLines.length > 0) {
    lines.push(`\nEndpoints (${endpointLines.length} total):`);
    const display = endpointLines.slice(0, 60);
    lines.push(...display);
    if (endpointLines.length > 60) {
      lines.push(`  ... and ${endpointLines.length - 60} more endpoints`);
    }
  }

  const content = lines.join("\n");
  const truncated = content.length > MAX_OUTPUT_CHARS;
  return {
    content: truncated ? `${content.slice(0, MAX_OUTPUT_CHARS)}\n[truncated]` : content,
    type: "openapi",
    title,
    endpointCount: endpointLines.length,
    truncated,
  };
}

// ─── HTML text extractor ────────────────────────────────────────────────────────

function extractTextFromHtml(html: string): string {
  return html
    // Remove entire <script> and <style> blocks
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    // Convert block-level elements to newlines for readable output
    .replace(
      /<\/?(h[1-6]|p|div|li|dt|dd|tr|thead|tbody|br|hr|section|article|header|footer|nav|main|aside)[^>]*>/gi,
      "\n"
    )
    // Strip all remaining HTML tags
    .replace(/<[^>]+>/g, " ")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/g, "'")
    // Collapse horizontal whitespace
    .replace(/[ \t]+/g, " ")
    // Collapse excessive blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Response body reader with size cap ────────────────────────────────────────

async function readBodyWithCap(
  body: ReadableStream<Uint8Array>
): Promise<{ text: string; truncated: boolean }> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  let truncated = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      bytesRead += value.byteLength;
      if (bytesRead > MAX_BODY_BYTES) {
        const allowed = MAX_BODY_BYTES - (bytesRead - value.byteLength);
        if (allowed > 0) chunks.push(value.slice(0, allowed));
        truncated = true;
        break;
      }
      chunks.push(value);
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return {
    text: new TextDecoder("utf-8", { fatal: false }).decode(merged),
    truncated,
  };
}

// ─── Main exported function ─────────────────────────────────────────────────────

/**
 * Fetch and parse API documentation from a given URL.
 *
 * - Throws a human-readable Error on any security or network failure.
 * - Safe to call only from server-side code (API routes, Server Components).
 * - Never call from client code — this imports Node.js built-ins.
 */
export async function fetchApiDocumentation(rawUrl: string): Promise<FetchDocResult> {
  // ── 1. Parse URL and validate scheme ──────────────────────────────────────
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  // ── 2. GitHub URL transform ────────────────────────────────────────────────
  const isGithub = url.hostname === "github.com";
  if (isGithub) {
    const transformed = transformGithubUrl(url);
    if (transformed !== rawUrl) {
      url = new URL(transformed);
    }
  }

  // ── 3. SSRF: DNS resolution check ─────────────────────────────────────────
  // Must happen after GitHub transform so we check the final hostname
  await assertSafeHostname(url.hostname);

  // ── 4. Fetch with timeout and size cap ─────────────────────────────────────
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "FloMCP-DocFetcher/1.0 (documentation context fetcher)",
        "Accept":     "application/json, text/html, text/plain, */*",
      },
      redirect: "follow",
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out after 5 seconds");
    }
    throw new Error("Failed to reach the URL");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} — ${response.statusText}`);
  }

  // ── 5. Read body with hard size cap ───────────────────────────────────────
  if (!response.body) throw new Error("Response had no body");
  const { text: rawText, truncated: bodyTruncated } = await readBodyWithCap(response.body);

  // ── 6. Detect content kind ────────────────────────────────────────────────
  const contentType = response.headers.get("content-type") ?? "";
  const kind = detectContentKind(contentType, rawText);

  // ── 7. Parse by type ───────────────────────────────────────────────────────
  if (kind === "json") {
    try {
      const obj = JSON.parse(rawText) as Record<string, unknown>;
      // Detect OpenAPI / Swagger document
      if ("openapi" in obj || "swagger" in obj || "paths" in obj) {
        const result = parseOpenAPISpec(obj as Record<string, unknown>);
        return { ...result, truncated: result.truncated || bodyTruncated };
      }
    } catch {
      // Malformed JSON — fall through to text handling
    }

    // Valid JSON but not an API spec — treat as plain text
    const truncated = rawText.length > MAX_OUTPUT_CHARS || bodyTruncated;
    return {
      content: truncated ? `${rawText.slice(0, MAX_OUTPUT_CHARS)}\n[truncated]` : rawText,
      type: "text",
      truncated,
    };
  }

  if (kind === "html") {
    const stripped = extractTextFromHtml(rawText);
    const truncated = stripped.length > MAX_OUTPUT_CHARS || bodyTruncated;
    return {
      content: truncated ? `${stripped.slice(0, MAX_OUTPUT_CHARS)}\n[truncated]` : stripped,
      type: isGithub ? "github" : "html",
      truncated,
    };
  }

  // Plain text / Markdown
  const truncated = rawText.length > MAX_OUTPUT_CHARS || bodyTruncated;
  return {
    content: truncated ? `${rawText.slice(0, MAX_OUTPUT_CHARS)}\n[truncated]` : rawText,
    type: "text",
    truncated,
  };
}

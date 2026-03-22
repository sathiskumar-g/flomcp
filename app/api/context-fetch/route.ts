/**
 * POST /api/context-fetch
 *
 * Server-side proxy that fetches and parses API documentation from a URL.
 * Client calls this to avoid CORS issues and to enforce SSRF protection.
 *
 * Security:
 *  - Auth required (Supabase session)
 *  - Rate-limited (15 req/min per IP)
 *  - All real fetching delegated to lib/context/fetch.ts which enforces SSRF rules
 *  - Error messages sanitized before sending to client
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import type { RateLimitConfig } from "@/lib/rate-limit";
import { fetchApiDocumentation } from "@/lib/context/fetch";

const DOC_FETCH_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 15,
  windowMs: 60 * 1000, // 15 fetches per minute per IP
};

/** Map internal error messages to user-facing messages that reveal no internals */
function toUserMessage(errorMessage: string): string {
  if (errorMessage.includes("Invalid URL format")) {
    return "Invalid URL format. Check the URL and try again.";
  }
  if (errorMessage.includes("Only HTTP and HTTPS")) {
    return "Only HTTP and HTTPS URLs are supported.";
  }
  if (errorMessage.includes("timed out")) {
    return "Request timed out — the server took too long to respond.";
  }
  if (errorMessage.includes("Failed to reach")) {
    return "Could not reach the URL. Check that it is publicly accessible.";
  }
  if (/HTTP 4\d\d/.test(errorMessage)) {
    return "The documentation URL returned an error (not found or access denied).";
  }
  if (/HTTP 5\d\d/.test(errorMessage)) {
    return "The documentation server returned a server error. Try again later.";
  }
  if (
    errorMessage.includes("Blocked") ||
    errorMessage.includes("private IP") ||
    errorMessage.includes("hostname") ||
    errorMessage.includes("resolve")
  ) {
    return "URL not allowed — blocked for security reasons.";
  }
  return "Could not fetch documentation. Check the URL and try again.";
}

export async function POST(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const ip = getClientIP(req);
  const rl = checkRateLimit(`context-fetch:${ip}`, DOC_FETCH_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Too many requests. Try again in ${rl.retryAfterSeconds} seconds.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      }
    );
  }

  // ── Parse request body ─────────────────────────────────────────────────────
  let url: string;
  try {
    const body = await req.json();
    url = body?.url;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!url || typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl.length > 2048) {
    return NextResponse.json({ error: "URL too long" }, { status: 400 });
  }

  // ── Fetch and parse ────────────────────────────────────────────────────────
  try {
    const result = await fetchApiDocumentation(trimmedUrl);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: toUserMessage(message) },
      { status: 422 }
    );
  }
}

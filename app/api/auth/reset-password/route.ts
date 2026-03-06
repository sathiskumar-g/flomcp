/**
 * Auth Proxy: Reset Password
 *
 * Sends a password reset email via Supabase, proxied through our server
 * so the browser doesn't need direct connectivity to Supabase.
 *
 * Security:
 * - Rate limited: 2 attempts per minute per IP
 * - Hardcoded redirect origin (no injection)
 * - Always returns success (doesn't reveal if email exists)
 */

import { createServerClient } from "@/lib/supabase-server";
import { withRetry, throwIfRetryable } from "@/lib/retry";
import { checkRateLimit, getClientIP, RESET_LIMIT } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

/** Safe origin — never from user-controlled headers */
function getAppOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    // ── Rate limit check ──
    const ip = getClientIP(request);
    const rl = checkRateLimit(`reset:${ip}`, RESET_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many reset attempts. Please try again in ${rl.retryAfterSeconds} seconds.` },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const origin = getAppOrigin();
    const supabase = createServerClient();

    // Supabase auth methods return { data, error } instead of throwing.
    // throwIfRetryable() converts network errors into throws so retry works.
    const { error } = await withRetry(
      async () => {
        const result = await supabase.auth.resetPasswordForEmail(email, {
          // Route through /auth/callback so the code is exchanged and a
          // recovery session cookie is set before landing on the reset page.
          redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
        });
        throwIfRetryable(result.error); // network error? throw → retry
        return result;
      },
      { maxRetries: 2, initialDelayMs: 1000 }
    );

    if (error) {
      // Log server-side for debugging, but always return generic success
      console.warn("[api/auth/reset-password] Supabase error:", error.message);
    }

    // Always return success — don't reveal if email exists
    return NextResponse.json({
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (err: any) {
    console.error("[api/auth/reset-password] Error:", err);
    return NextResponse.json(
      {
        error:
          "Unable to reach the authentication server. Please try again in a moment.",
        code: "network_error",
      },
      { status: 503 }
    );
  }
}

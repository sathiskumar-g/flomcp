/**
 * Auth Proxy: Sign In
 *
 * The browser calls THIS route instead of talking to Supabase directly.
 * Our server has the IPv4 fix (setGlobalDispatcher) + retry logic,
 * so it reliably reaches Supabase even when the browser can't.
 *
 * Security:
 * - Rate limited: 5 attempts per minute per IP
 * - Generic error messages (no Supabase internals leaked)
 * - Retry only on network errors, not auth failures
 *
 * Flow: Browser → localhost/api/auth/signin → Server → Supabase
 */

import { createServerClient } from "@/lib/supabase-server";
import { withRetry, throwIfRetryable, isRetryableError } from "@/lib/retry";
import { checkRateLimit, getClientIP, SIGNIN_LIMIT } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // ── Rate limit check ──
    const ip = getClientIP(request);
    const rl = checkRateLimit(`signin:${ip}`, SIGNIN_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many sign-in attempts. Please try again in ${rl.retryAfterSeconds} seconds.` },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Supabase auth methods return { data, error } instead of throwing.
    // throwIfRetryable() converts network errors into throws so retry works.
    const { data, error } = await withRetry(
      async () => {
        const result = await supabase.auth.signInWithPassword({ email, password });
        throwIfRetryable(result.error); // network error? throw → retry
        return result;
      },
      { maxRetries: 2, initialDelayMs: 1000 }
    );

    if (error) {
      // At this point, error is an APPLICATION error (wrong password, etc.)
      // because network errors were thrown and retried above.
      const status = error.status || 401;
      let safeMessage = "Invalid email or password.";
      if (status === 429) {
        safeMessage = "Too many attempts. Please wait a moment and try again.";
      } else if (status >= 500) {
        safeMessage = "Authentication service is temporarily unavailable.";
      }
      return NextResponse.json({ error: safeMessage }, { status });
    }

    // Check email verification
    if (data.user && !data.user.email_confirmed_at) {
      return NextResponse.json(
        {
          error:
            "Please verify your email address before signing in. Check your inbox for the verification link.",
          code: "email_not_verified",
        },
        { status: 403 }
      );
    }

    // Success — cookies are already set by the server client's cookie handler.
    // Return minimal user info so the browser knows it worked.
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
      },
    });
  } catch (err: any) {
    console.error("[api/auth/signin] Error:", err);

    return NextResponse.json(
      {
        error:
          "Unable to reach the authentication server after multiple retries. Please check your internet connection and try again.",
        code: "network_error",
      },
      { status: 503 }
    );
  }
}

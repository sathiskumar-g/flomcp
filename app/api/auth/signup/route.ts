/**
 * Auth Proxy: Sign Up
 *
 * The browser calls THIS route instead of talking to Supabase directly.
 * Our server has the IPv4 fix (setGlobalDispatcher) + retry logic.
 *
 * Security:
 * - Rate limited: 3 attempts per minute per IP
 * - Disposable email check (server-side, can't be bypassed)
 * - Safe error messages (no Supabase internals leaked)
 * - Hardcoded redirect origin (no injection)
 *
 * Flow: Browser → localhost/api/auth/signup → Server → Supabase
 */

import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { withRetry, throwIfRetryable } from "@/lib/retry";
import { checkRateLimit, getClientIP, SIGNUP_LIMIT } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { validateEmail } from "@/lib/validate-email";

/** Safe origin for email redirect — never from user-controlled headers */
function getAppOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    // ── Rate limit check ──
    const ip = getClientIP(request);
    const rl = checkRateLimit(`signup:${ip}`, SIGNUP_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many sign-up attempts. Please try again in ${rl.retryAfterSeconds} seconds.` },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const { email, password, metadata } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // 3-layer email validation: regex + disposable blocklist + MX record check
    const emailCheck = await validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    const origin = getAppOrigin();
    const supabase = createServerClient();

    // Supabase auth methods return { data, error } instead of throwing.
    // throwIfRetryable() converts network errors into throws so retry works.
    const { data, error } = await withRetry(
      async () => {
        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: metadata || {},
          },
        });
        throwIfRetryable(result.error); // network error? throw → retry
        return result;
      },
      { maxRetries: 2, initialDelayMs: 1000 }
    );

    if (error) {
      // Map to safe error messages
      const status = error.status || 400;
      let safeMessage = "Failed to create account. Please try again.";
      if (status === 429) {
        safeMessage = "Too many attempts. Please wait a moment and try again.";
      } else if (status >= 500) {
        safeMessage = "Authentication service is temporarily unavailable.";
      } else if (error.message?.toLowerCase().includes("already registered")) {
        // Don't reveal if user exists — generic message
        safeMessage = "Failed to create account. Please try again or sign in instead.";
      }
      return NextResponse.json({ error: safeMessage }, { status });
    }

    // Success — verification email sent by Supabase
    // NOTE: wrap in try/catch so notification failures never return 503 to the
    // user when signup itself already succeeded.
    if (data.user?.id) {
      try {
        const admin = createAdminClient();

        // Welcome notification — fire-and-forget
        admin.from("notifications").insert({
          user_id: data.user.id,
          type: "system_message",
          title: "Welcome to FloMCP!",
          body: "Your account is set up and ready. Generate your first MCP server to get started.",
        }).then();
      } catch {
        // Admin client unavailable (e.g. missing env var) — non-critical, skip
      }

      // Notify support team about new signup — fire-and-forget
      const supportEmail = process.env.SUPPORT_EMAIL || "support@flomcp.com";
      sendEmail({
        to: supportEmail,
        subject: `[NEW USER] New signup: ${data.user.email}`,
        html: `<p>New user signed up: <strong>${data.user.email}</strong></p><p>User ID: ${data.user.id}</p><p>Time: ${new Date().toISOString()}</p>`,
      }).catch(() => {});
    }

    return NextResponse.json({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
          }
        : null,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (err: any) {
    console.error("[api/auth/signup] Error:", err);
    // A network timeout can occur AFTER Supabase has already created the account
    // and sent the verification email. In that case, telling the user to "retry"
    // is misleading — they may already have an account. Return a softer message.
    const isNetworkErr =
      err?.name === "AbortError" ||
      err?.name === "AuthRetryableFetchError" ||
      (err?.message || "").toLowerCase().includes("fetch failed") ||
      (err?.message || "").toLowerCase().includes("timed out");

    if (isNetworkErr) {
      return NextResponse.json(
        {
          error:
            "Your account may have been created. Please check your email for a verification link, or try signing in.",
          code: "network_timeout",
        },
        { status: 503 }
      );
    }

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

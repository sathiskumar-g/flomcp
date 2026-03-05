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
import { withRetry, throwIfRetryable } from "@/lib/retry";
import { checkRateLimit, getClientIP, SIGNUP_LIMIT } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

// Disposable email domains — duplicated server-side so it can't be bypassed
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "guerrillamail.com", "10minutemail.com",
  "mailinator.com", "throwaway.email", "maildrop.cc",
  "temp-mail.org", "getnada.com", "trashmail.com",
  "yopmail.com", "fakeinbox.com", "mintemail.com",
  "mohmal.com", "emailondeck.com", "throwawaymail.com",
  "tempail.com", "discard.email", "guerrillamailblock.com",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}

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

    // Server-side disposable email check (can't be bypassed)
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { error: "Disposable email addresses are not allowed. Please use a permanent email." },
        { status: 400 }
      );
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
    // Notify support team about new signup (non-blocking)
    if (data.user?.email) {
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

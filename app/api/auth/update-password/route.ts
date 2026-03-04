/**
 * Auth Proxy: Update Password
 *
 * Requires an authenticated session (reads from cookies).
 * Validates the new password then calls supabase.auth.updateUser().
 *
 * Security:
 * - Rate limited: 3 attempts per minute per IP
 * - Must be authenticated — cannot update another user's password
 * - Minimum password length enforced server-side
 *
 * Flow: Browser → /api/auth/update-password → Server → Supabase
 */

import { createServerClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { withRetry, throwIfRetryable } from "@/lib/retry";
import { NextResponse } from "next/server";
import type { RateLimitConfig } from "@/lib/rate-limit";

const UPDATE_PASSWORD_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 60 * 1000,
};

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rl = checkRateLimit(`update-password:${ip}`, UPDATE_PASSWORD_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const body = await request.json();
    const { password } = body as { password?: string };

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    if (password.length > 72) {
      return NextResponse.json(
        { error: "Password must be 72 characters or fewer." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify the user is authenticated (getUser validates token server-side)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { error } = await withRetry(
      async () => {
        const result = await supabase.auth.updateUser({ password });
        throwIfRetryable(result.error);
        return result;
      },
      { maxRetries: 2, initialDelayMs: 800 }
    );

    if (error) {
      const msg =
        error.status === 422
          ? "New password must be different from your current password."
          : "Failed to update password. Please try again.";
      return NextResponse.json({ error: msg }, { status: error.status ?? 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[api/auth/update-password]", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}

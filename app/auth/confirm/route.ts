/**
 * Email Confirmation Handler — token_hash approach (no PKCE)
 *
 * Email templates link here instead of directly to supabase.co/auth/v1/verify.
 * This fixes two bugs:
 *   1. otp_expired — the old direct Supabase URL could be pre-fetched by Gmail's
 *      security scanner, consuming the one-time PKCE token before the user clicks.
 *   2. auth_exchange_failed — PKCE code_verifier generated in server-proxy routes
 *      wasn't reliably available at the callback, causing exchangeCodeForSession to fail.
 *
 * verifyOtp({ token_hash, type }) is Supabase's recommended SSR approach:
 *   - No PKCE code_verifier required
 *   - Works with tokens issued by server-side auth proxy routes
 *   - Properly sets session cookies via the server client setAll handler
 *
 * Email template variables used:
 *   {{ .TokenHash }} — SHA-256 hash of the OTP (not the pkce_-prefixed token)
 *   {{ .SiteURL }}  — configured in Supabase → Auth → URL Configuration
 *
 * Template button href:
 *   signup:   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard
 *   recovery: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
 */

import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as
    | "signup"
    | "recovery"
    | "magiclink"
    | "email"
    | null;
  const rawNext = requestUrl.searchParams.get("next") || "/dashboard";
  // Sanitize: must start with / and not // (prevents open redirect)
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  if (!token_hash || !type) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/error?error=missing_token`
    );
  }

  const supabase = createServerClient();

  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    console.error("[auth/confirm] verifyOtp error:", error.message);
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/error?error=auth_exchange_failed`
    );
  }

  // For signup, pass verified=true so the dashboard can show a welcome message
  return NextResponse.redirect(
    type === "signup"
      ? `${requestUrl.origin}${next}?verified=true`
      : `${requestUrl.origin}${next}`
  );
}

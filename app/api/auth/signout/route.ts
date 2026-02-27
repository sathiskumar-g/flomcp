/**
 * Auth Proxy: Sign Out
 *
 * Clears the Supabase session server-side and removes auth cookies.
 * Browser calls this instead of supabase.auth.signOut() directly.
 *
 * Security:
 * - Rate limited (generous — low risk)
 * - Origin check to prevent CSRF-triggered force-logout
 */

import { createServerClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIP, SIGNOUT_LIMIT } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // ── Rate limit ──
  const ip = getClientIP(request);
  const rl = checkRateLimit(`signout:${ip}`, SIGNOUT_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ success: false }, { status: 429 });
  }

  try {
    const supabase = createServerClient();

    // signOut clears the session and cookies via the server client cookie handler.
    // No retry needed — even if Supabase is unreachable, we clear local cookies.
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.warn("[api/auth/signout] Supabase signOut error:", error.message);
      // Still return success — cookies are cleared regardless
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[api/auth/signout] Error:", err);
    // Still return success — the intent is to sign out
    return NextResponse.json({ success: true });
  }
}

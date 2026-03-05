/**
 * Auth Proxy: Delete Account
 *
 * Hard-deletes the authenticated user and all their data.
 * Requires the user to confirm by typing their email.
 *
 * Deletion order:
 *   1. user_usage row (if exists)
 *   2. mcp_servers rows (if exist)
 *   3. auth.users entry — via admin client (service-role)
 *
 * Security:
 * - Rate limited: 2 attempts per minute per IP
 * - Must be authenticated
 * - Confirmation email must match the session email
 */

import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { RateLimitConfig } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

const DELETE_ACCOUNT_LIMIT: RateLimitConfig = {
  maxRequests: 2,
  windowMs: 60 * 1000,
};

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rl = checkRateLimit(`delete-account:${ip}`, DELETE_ACCOUNT_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { confirmEmail } = body as { confirmEmail?: string };

    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const userId = user.id;
    const sessionEmail = user.email ?? "";

    // Confirm email matches
    if (!confirmEmail || confirmEmail.trim().toLowerCase() !== sessionEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "Email confirmation does not match your account email." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Delete user_usage
    await admin.from("user_usage").delete().eq("user_id", userId);

    // 2. Delete mcp_servers
    await admin.from("mcp_servers").delete().eq("user_id", userId);

    // 3. Delete auth user — this is the hard delete
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("[api/auth/delete-account] deleteUser error:", deleteError.message);
      return NextResponse.json(
        { error: "Failed to delete account. Please contact support." },
        { status: 500 }
      );
    }

    // Notify support team about account deletion (non-blocking)
    const supportEmail = process.env.SUPPORT_EMAIL || "support@flomcp.com";
    sendEmail({
      to: supportEmail,
      subject: `[CHURN USER] Account deleted: ${sessionEmail}`,
      html: `<p>A user has deleted their account.</p><p>Email: <strong>${sessionEmail}</strong></p><p>User ID: ${userId}</p><p>Time: ${new Date().toISOString()}</p>`,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[api/auth/delete-account]", err);
    return NextResponse.json({ error: "Unexpected error. Please try again." }, { status: 500 });
  }
}

/**
 * Auth Proxy: Update User Profile Metadata
 *
 * Stores display_name and profile_role in Supabase user_metadata.
 * No separate DB table required — piggybacks on Supabase auth.users.
 *
 * Security:
 * - Rate limited: 10 per minute per IP
 * - Must be authenticated
 * - Input sanitised and length-capped server-side
 */

import { createServerClient } from "@/lib/supabase-server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { RateLimitConfig } from "@/lib/rate-limit";

const UPDATE_PROFILE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000,
};

const ALLOWED_ROLES = [
  "Developer",
  "Team Lead",
  "Student",
  "Researcher",
  "Other",
] as const;

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rl = checkRateLimit(`update-profile:${ip}`, UPDATE_PROFILE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { display_name, profile_role } = body as {
      display_name?: string;
      profile_role?: string;
    };

    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    // Validate
    const updates: Record<string, string> = {};

    if (display_name !== undefined) {
      const name = String(display_name).trim().slice(0, 64);
      updates.display_name = name;
    }

    if (profile_role !== undefined) {
      if (!ALLOWED_ROLES.includes(profile_role as (typeof ALLOWED_ROLES)[number])) {
        return NextResponse.json({ error: "Invalid role value." }, { status: 400 });
      }
      updates.profile_role = profile_role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({ data: updates });

    if (error) {
      return NextResponse.json({ error: "Failed to update profile." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[api/auth/update-profile]", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

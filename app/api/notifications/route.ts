/**
 * Notifications API
 *
 * GET    /api/notifications        — Fetch current user's notifications
 * PATCH  /api/notifications        — Mark one or all as read
 * DELETE /api/notifications        — Clear all notifications
 */

import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// BUG-002: Use getUser() instead of getSession() for server-side token validation
async function getAuthUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ─── GET — list notifications ─────────────────────────────────────────────────

export async function GET() {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Table not yet created — return empty list gracefully
      if (error.code === "42P01") {
        return NextResponse.json({ notifications: [], unread_count: 0 });
      }
      console.error("Notifications GET error:", error);
      return NextResponse.json({ error: "Failed to fetch notifications." }, { status: 500 });
    }

    const unread_count = (data ?? []).filter((n) => !n.read).length;
    return NextResponse.json({ notifications: data ?? [], unread_count });
  } catch (err) {
    console.error("Notifications GET error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─── PATCH — mark as read ─────────────────────────────────────────────────────

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json() as { action: string; id?: string };
    const { action, id } = body;

    if (action === "mark_read" && id) {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: "Failed to mark notification as read." }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "mark_all_read") {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        return NextResponse.json({ error: "Failed to mark all as read." }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err) {
    console.error("Notifications PATCH error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─── DELETE — clear all ───────────────────────────────────────────────────────

export async function DELETE() {
  try {
    const { supabase, user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to clear notifications." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notifications DELETE error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

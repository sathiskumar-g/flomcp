import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

/**
 * POST /api/feedback
 * Saves user_feedback JSON onto the mcp_servers row.
 *
 * Body: { serverId: string; rating: "up" | "down"; comment: string | null }
 */
export async function POST(req: NextRequest) {
  try {
    const { serverId, rating, comment } = await req.json();

    if (!serverId || !["up", "down"].includes(rating)) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const supabase = createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const feedbackPayload = {
      rating,
      comment: comment ?? null,
      submittedAt: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from("mcp_servers")
      .update({ user_feedback: feedbackPayload })
      .eq("id", serverId)
      .eq("user_id", user.id); // scoped to owner only

    if (updateError) {
      console.error("[feedback] update error:", updateError.message);
      // Non-fatal — return ok anyway so the UI doesn't error
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback] unexpected error:", err);
    return NextResponse.json({ ok: true }); // fire-and-forget — never surface errors to user
  }
}

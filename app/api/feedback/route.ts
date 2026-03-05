import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email";

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

    // Notify support team about feedback (non-blocking)
    const supportEmail = process.env.SUPPORT_EMAIL || "support@flomcp.com";
    sendEmail({
      to: supportEmail,
      subject: `[FEEDBACK] Server feedback: ${rating === "up" ? "👍" : "👎"} ${rating} — ${serverId.slice(0, 8)}`,
      html: `<p><strong>Server Feedback Submitted</strong></p><p>User: ${user.email ?? user.id}</p><p>Server ID: ${serverId}</p><p>Rating: ${rating === "up" ? "👍 Thumbs Up" : "👎 Thumbs Down"}</p><p>Comment: ${comment ? comment : "(no comment)"}</p><p>Time: ${new Date().toISOString()}</p>`,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback] unexpected error:", err);
    return NextResponse.json({ ok: true }); // fire-and-forget — never surface errors to user
  }
}

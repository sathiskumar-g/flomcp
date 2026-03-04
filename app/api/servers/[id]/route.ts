import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * GET /api/servers/[id]
 * Returns full server detail (including code files) for the authenticated user.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mcp_servers")
    .select(
      "id, name, description, status, security_score, generated_code, package_json, readme, tsconfig, env_example, api_config, created_at, downloaded, security_report, generation_input, user_feedback"
    )
    .eq("id", params.id)
    .eq("user_id", user.id) // ownership check
    .single();

  if (error || !data) {
    // Distinguish DB errors (timeout/network) from actual "not found"
    if (error && error.code !== "PGRST116") {
      // PGRST116 = "JSON object requested, multiple (or no) rows returned" = not found
      console.error("DB query error for server", params.id, error);
      return NextResponse.json(
        { error: "Failed to fetch server. Please try again." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Server not found" }, { status: 404 });
  }

  return NextResponse.json({ server: data });
}

/**
 * PATCH /api/servers/[id]
 * Updates mutable fields (e.g. mark downloaded).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allowedFields = ["downloaded", "downloaded_at"];
  const updates: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key];
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("mcp_servers")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id); // ownership check

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

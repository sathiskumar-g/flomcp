import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * GET /api/servers
 * Returns all MCP servers belonging to the authenticated user, newest first.
 */
export async function GET(_req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Query with admin client (bypasses RLS; ownership enforced by .eq)
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mcp_servers")
    .select("id, name, description, status, security_score, tokens_used, cost_usd, created_at, downloaded")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ servers: data ?? [] });
}

/**
 * DELETE /api/servers?id=<uuid>
 * Deletes a single server belonging to the authenticated user.
 */
export async function DELETE(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("mcp_servers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id); // ownership check

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

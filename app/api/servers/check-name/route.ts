import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * GET /api/servers/check-name?name=<server-name>
 *
 * Returns { exists: boolean } — true if the authenticated user already
 * has a server with that name (case-insensitive).
 */
export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const name = req.nextUrl.searchParams.get("name")?.trim();
  if (!name || name.length < 3) {
    return NextResponse.json({ exists: false });
  }

  const admin = createAdminClient();
  const { count, error } = await admin
    .from("mcp_servers")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .ilike("name", name); // case-insensitive match

  if (error) {
    return NextResponse.json({ exists: false }); // fail open — don't block the user
  }

  return NextResponse.json({ exists: (count ?? 0) > 0 });
}

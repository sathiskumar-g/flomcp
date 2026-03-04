/**
 * GET /api/stats
 * Returns public live stats — currently just total generated server count.
 * Used for social proof counter in the landing page hero.
 * No auth required — safe to call from client and server components.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("mcp_servers")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({ count: count ?? 0 }, {
      headers: {
        // Allow client caching for 60 s — refreshes on each page load anyway
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    // Fail silently — social proof counter is non-critical
    return NextResponse.json({ count: 0 });
  }
}

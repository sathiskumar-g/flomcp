/**
 * GET /api/founding-spots
 * Returns the number of remaining founding member spots.
 * Total: 50. Remaining = 50 - count(pro_interest).
 * No auth required — safe to call from client.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const admin = createAdminClient();
    const { count, error } = await admin
      .from("pro_interest")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    const taken = count ?? 0;
    const remaining = Math.max(0, 50 - taken);

    return NextResponse.json({ remaining, taken }, {
      headers: {
        // Cache for 60 s on the server; client always gets fresh via no-store
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch {
    // Fail silently — counter is non-critical; return optimistic value
    return NextResponse.json({ remaining: 49, taken: 1 });
  }
}

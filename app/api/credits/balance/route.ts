/**
 * GET /api/credits/balance
 *
 * Returns the authenticated user's current credit balance.
 * Used by CreditChip and any other client component that needs live balance.
 *
 * Response 200:
 *   { plan, monthly, bonus, total }
 *
 * Response 401: not authenticated
 * Response 404: no credits row yet (should not happen after migration)
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getBalance, ensureCreditRow } from "@/lib/credits-service";

export const dynamic = "force-dynamic"; // never cache — balance must be live

export async function GET() {
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure row exists (handles pre-migration / race-on-signup)
  await ensureCreditRow(user.id);

  const balance = await getBalance(user.id);
  if (!balance) {
    return NextResponse.json({ error: "Credits row not found" }, { status: 404 });
  }

  return NextResponse.json(balance);
}

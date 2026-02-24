/**
 * Supabase Admin / Service-Role Client
 *
 * ⚠️  SERVER-SIDE ONLY — never import this in client components.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security.
 * Only use for admin operations and internal tooling.
 *
 * Usage:
 *   import { createAdminClient } from '@/lib/supabase-admin'
 *   const supabase = createAdminClient()
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Creates a Supabase client with the service-role key.
 * Bypasses RLS — use only in server-side admin routes.
 */
export function createAdminClient() {
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Cannot create admin client."
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

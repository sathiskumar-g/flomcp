/**
 * Supabase Client Configuration (Client-Side Only)
 *
 * Uses createBrowserClient from @supabase/ssr so the session is stored in
 * cookies (not localStorage). This is required for the Next.js middleware to
 * read the session server-side and protect /dashboard routes.
 *
 * For server-side usage, use lib/supabase-server.ts instead.
 */

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase browser client.
 * Session is stored in cookies so middleware + server components can read it.
 * Call this inside client components — do not call at module level.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Supabase Server Client Configuration (Server-Side Only)
 * 
 * This file is for SERVER COMPONENTS and API ROUTES
 * For client-side usage, use lib/supabase.ts instead
 * 
 * Usage:
 * import { createServerClient } from '@/lib/supabase-server'
 * const supabase = createServerClient()
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for server-side usage
 * Use this in Server Components, API Routes, and Server Actions
 * 
 * IMPORTANT: This function uses next/headers (cookies()) so it can ONLY
 * be used in Server Components or API Routes, NOT in Client Components
 */
export function createServerClient() {
  const cookieStore = cookies();

  return createSupabaseServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error in middleware
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle error in middleware
          }
        },
      },
    }
  );
}

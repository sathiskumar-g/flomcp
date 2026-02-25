/**
 * Supabase Server Client Configuration (Server-Side Only)
 *
 * Uses @supabase/ssr 0.8.x getAll/setAll cookie API.
 * Works in Server Components, API Route Handlers, and Server Actions.
 * For client-side usage, use lib/supabase.ts instead.
 *
 * IPv4 connectivity is handled globally by next.config.js (setGlobalDispatcher).
 */

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createServerClient() {
  const cookieStore = cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    global: {
      // 15s timeout — global dispatcher in next.config.js forces IPv4.
      fetch: (url, options) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        return fetch(url, { ...options, signal: controller.signal }).finally(() =>
          clearTimeout(timer)
        );
      },
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll may throw in Server Components (read-only context).
          // The middleware handles session refresh — safe to ignore here.
        }
      },
    },
  });
}

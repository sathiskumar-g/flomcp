/**
 * Supabase Client Configuration (Client-Side Only)
 * 
 * This file is for CLIENT COMPONENTS ("use client")
 * For server-side usage, use lib/supabase-server.ts instead
 * 
 * Usage:
 * import { createClient } from '@/lib/supabase'
 * const supabase = createClient()
 */

import { createClient as createBrowserClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Creates a Supabase client for browser/client-side usage
 * Use this in Client Components ("use client")
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Legacy export for backward compatibility
export const supabase = createClient();

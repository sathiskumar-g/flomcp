import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Returns true only when real credentials are present
export const isSupabaseConfigured =
  supabaseUrl.startsWith("http") && supabaseAnonKey.length > 20;

// Single shared client — safe to import anywhere.
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-key-placeholder-key-placeholder"
);

// Base URL used to build auth email redirect links (signup confirm, password reset).
// Priority: explicit NEXT_PUBLIC_SITE_URL env var -> current browser origin (dev fallback).
// Set NEXT_PUBLIC_SITE_URL to your production domain so emails always point there,
// even when you trigger them from localhost.
export function getSiteURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  // Ensure it has a protocol and no trailing slash.
  if (!url.startsWith("http")) url = `https://${url}`;
  return url.replace(/\/+$/, "");
}

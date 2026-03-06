"use client";

/**
 * ProtectedRoute Component
 * 
 * A wrapper component that protects routes requiring authentication.
 * Uses getSession() for instant local JWT check (no network call).
 * The middleware handles token refresh before this component runs.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerifiedEmail?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireVerifiedEmail = true 
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // getSession() reads from local cookies — instant, no network call.
        // Middleware already refreshed the token before this page loaded.
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;

        if (!mounted) return;

        if (!currentUser) {
          router.push('/auth/signin');
          return;
        }

        // Check email verification if required
        if (requireVerifiedEmail && !currentUser.email_confirmed_at) {
          router.push('/auth/verify-email');
          return;
        }

        setUser(currentUser);
      } catch (err) {
        if (mounted) {
          router.push('/auth/signin');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // No auth listener here to prevent AbortError with Supabase locks
    // The landing page header already has an auth listener for UI updates

    return () => {
      mounted = false;
    };
  }, [router, requireVerifiedEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

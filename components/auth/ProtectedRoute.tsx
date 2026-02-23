"use client";

/**
 * ProtectedRoute Component
 * 
 * A wrapper component that protects routes requiring authentication
 * Fixed: Removed getSession() call that was causing AbortError
 * Now uses getUser() which is more reliable in client components
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
        // Use getUser() instead of getSession() to avoid AbortError
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error || !currentUser) {
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
        console.error('Auth error:', err);
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

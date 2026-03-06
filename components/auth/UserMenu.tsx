"use client";

/**
 * UserMenu Component
 * 
 * Shows user profile dropdown when logged in
 * Features:
 * - User email display
 * - Dashboard link
 * - Create new account option (opens signup in new window)
 * - Logout functionality
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CreditChip } from "@/components/dashboard/CreditChip";
import { User, LayoutDashboard, UserPlus, LogOut, Loader2 } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserMenuProps {
  user: SupabaseUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);

  // Prefer full name from OAuth metadata, fall back to email prefix
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';
  const userEmail = user.email || '';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Sign out via server-side proxy (clears cookies reliably)
      await fetch("/api/auth/signout", { method: "POST" });
    } catch (error) {
      
      // Fallback: clear local Supabase state
      try { await supabase.auth.signOut(); } catch {}
    } finally {
      setLoggingOut(false);
    }
    // Hard redirect — forces full page reload so client-side auth state resets.
    // router.refresh() alone does NOT reset useState, so the nav would still
    // show the user as logged in until the next manual refresh.
    window.location.href = '/';
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  const handleNewAccount = () => {
    // Open signup in new window/tab
    window.open('/auth/signup', '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">{displayName}</span>
          <CreditChip variant="badge" className="hidden sm:inline-flex" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDashboard} className="cursor-pointer">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleNewAccount} className="cursor-pointer">
          <UserPlus className="mr-2 h-4 w-4" />
          <span>Create New Account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="cursor-pointer text-red-600 focus:text-red-600"
          disabled={loggingOut}
        >
          {loggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

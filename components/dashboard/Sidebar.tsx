"use client";

/**
 * Dashboard Sidebar Component
 * 
 * Task 1.3.2: Build sidebar component (2%)
 * 
 * Features:
 * - Navigation links to main dashboard sections
 * - Active route highlighting
 * - Responsive (collapses on mobile)
 * - Icon + text navigation
 */

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Sparkles, 
  Settings,
  Code2,
  HelpCircle,
  Bell,
  Library,
} from "lucide-react";
import { NotificationPanel } from "@/components/dashboard/NotificationPanel";
import { CreditChip } from "@/components/dashboard/CreditChip";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [panelOpen, setPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarUser, setSidebarUser] = useState<User | null>(null);

  const handleUnreadChange = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  // Load current user for the sidebar identity section
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSidebarUser(session?.user ?? null);
    });
  }, []);

  const sidebarDisplayName =
    sidebarUser?.user_metadata?.full_name ||
    sidebarUser?.user_metadata?.name ||
    sidebarUser?.email?.split('@')[0] ||
    'Account';

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My MCP Servers",
      href: "/dashboard/servers",
      icon: Code2,
    },
    {
      label: "Generate New",
      href: "/dashboard/generate",
      icon: Sparkles,
    },
    {
      label: "Library",
      href: "/dashboard/library",
      icon: Library,
    },
    {
      label: "Support",
      href: "/dashboard/support",
      icon: HelpCircle,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-card/30">
      {/* Notification slide-in panel */}
      <NotificationPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        onUnreadChange={handleUnreadChange}
      />
      {/* Logo Section */}
      <div className="p-6 border-b border-border/40">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push('/')}
        >
          <Logo height={28} />
          <p className="text-xs text-muted-foreground leading-none mt-0.5">MCP Generator</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                active 
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground" 
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-primary-foreground")} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  active 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-primary/10 text-primary"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User identity + credits */}
      <div className="px-4 pb-3">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30 border border-border/40 cursor-pointer hover:bg-accent/40 transition-colors"
          onClick={() => router.push('/dashboard/settings')}
          title="Account settings"
        >
          {/* Avatar circle */}
          <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-primary/15 text-primary font-semibold text-sm">
            {(sidebarDisplayName?.[0] ?? '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{sidebarDisplayName}</p>
            <CreditChip variant="pill" className="mt-1" />
          </div>
        </div>
      </div>

      {/* Footer - Version & Links + Bell */}
      <div className="p-4 border-t border-border/40">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground space-y-1 min-w-0">
            <p className="font-medium">FloMCP v1.0.0</p>
            <div className="flex gap-3">
              <a 
                href="/legal/terms-of-service" 
                className="hover:text-foreground transition-colors"
                target="_blank"
              >
                Terms
              </a>
              <a 
                href="/legal/acceptable-use" 
                className="hover:text-foreground transition-colors"
                target="_blank"
              >
                Policy
              </a>
              <a 
                href="/docs/getting-started" 
                className="hover:text-foreground transition-colors"
              >
                Docs
              </a>
            </div>
          </div>

          {/* Bell button with unread badge */}
          <button
            onClick={() => setPanelOpen(true)}
            className="relative shrink-0 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

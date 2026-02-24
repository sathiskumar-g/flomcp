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

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Sparkles, 
  BarChart3, 
  Settings,
  Code2
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

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
      label: "Usage Stats",
      href: "/dashboard/usage",
      icon: BarChart3,
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
    <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-card/30 backdrop-blur">
      {/* Logo Section */}
      <div className="p-6 border-b border-border/40">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push('/dashboard')}
        >
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
            <Code2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">FloMCP</h2>
            <p className="text-xs text-muted-foreground">MCP Generator</p>
          </div>
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

      {/* Footer - Version & Links */}
      <div className="p-4 border-t border-border/40">
        <div className="text-xs text-muted-foreground space-y-1">
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
      </div>
    </aside>
  );
}

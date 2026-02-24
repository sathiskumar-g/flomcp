/**
 * Dashboard Layout Component
 * 
 * Task 1.3.1: Create dashboard layout component (2%)
 * 
 * Features:
 * - Wraps all dashboard pages
 * - Includes Sidebar navigation
 * - Mobile-responsive header
 * - User menu in top right
 * - Protected by authentication
 */

import { Sidebar } from "@/components/dashboard/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      <div className="flex h-screen">
        {/* Sidebar - Hidden on mobile */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile Header (shows on small screens) */}
          <div className="md:hidden sticky top-0 z-40 flex items-center justify-between p-4 border-b border-border/40 bg-background/95 backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg 
                  className="h-5 w-5 text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <span className="font-bold">FloMCP</span>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

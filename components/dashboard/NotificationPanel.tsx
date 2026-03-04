"use client";

/**
 * NotificationPanel
 *
 * A slide-in panel rendered inside the sidebar. Always mounted (to track
 * unread count via Realtime); visible only when isOpen === true.
 *
 * Props:
 *  isOpen             — controls visibility
 *  onClose            — called when the user closes the panel
 *  onUnreadChange     — fired whenever the unread count changes (for badge)
 */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  X,
  Bell,
  BellOff,
  Sparkles,
  Shield,
  MessageSquare,
  Loader2,
  CheckCheck,
  Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: "generation_complete" | "security_alert" | "system_message";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange: (count: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeIcon(type: Notification["type"]) {
  switch (type) {
    case "generation_complete":
      return <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />;
    case "security_alert":
      return <Shield className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />;
    case "system_message":
      return <MessageSquare className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />;
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationPanel({
  isOpen,
  onClose,
  onUnreadChange,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Computed unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Keep parent badge in sync
  useEffect(() => {
    onUnreadChange(unreadCount);
  }, [unreadCount, onUnreadChange]);

  // ─── Fetch notifications ────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount (to load unread count for badge)
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Re-fetch when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // ─── Supabase Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();

    // Get current user id for the realtime filter
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);

      const channel = supabase
        .channel(`notifications:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, []);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", id }),
    });
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
  };

  const clearAll = async () => {
    setNotifications([]);
    await fetch("/api/notifications", { method: "DELETE" });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-screen w-1/4 min-w-[400px] z-50 flex flex-col bg-card border-l border-border/40 shadow-2xl transition-transform duration-300 ease-in-out overflow-hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close notifications"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Action bar */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 shrink-0">
          {unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">All read</span>
          )}
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-red-500/70 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3 px-4 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">You&apos;re all caught up</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/30">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => !n.read && markRead(n.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors",
                    n.read
                      ? "opacity-60 hover:opacity-80"
                      : "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  {typeIcon(n.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          "text-xs font-medium leading-snug truncate",
                          !n.read && "text-foreground"
                        )}
                      >
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                        {n.body}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
    </>
  );
}

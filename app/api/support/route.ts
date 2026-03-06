/**
 * Support Tickets API
 *
 * POST /api/support  — Submit a new support ticket
 * GET  /api/support  — Fetch current user's tickets
 *
 * Security:
 * - Auth required
 * - Rate limited: 5 tickets per minute per IP (POST)
 * - Inputs validated and length-capped server-side
 */

import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import type { RateLimitConfig } from "@/lib/rate-limit";

const SUPPORT_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 1000,
};

const VALID_CATEGORIES = [
  "billing",
  "technical",
  "account",
  "feature-request",
  "bug",
  "other",
] as const;

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

type Category = (typeof VALID_CATEGORIES)[number];
type Priority = (typeof VALID_PRIORITIES)[number];

// ─── Email Templates ──────────────────────────────────────────────────────────

function getAdminSupportEmail(
  ticketId: string,
  userEmail: string,
  subject: string,
  category: string,
  priority: string,
  description: string
): string {
  const priorityLabels: Record<string, string> = {
    low: "🟢 Low",
    medium: "🟡 Medium",
    high: "🟠 High",
    urgent: "🔴 Urgent",
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #111111; margin: 0; padding: 0; background: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #783ae6; color: #ffffff; padding: 28px 30px; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
          .content { background: #f7f7f7; padding: 28px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e8e8e8; border-top: none; }
          .info-box { background: #ffffff; padding: 16px 20px; border-radius: 8px; margin: 10px 0; border: 1px solid #e8e8e8; border-left: 4px solid #783ae6; }
          .info-box p { margin: 0; }
          .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #888888; margin-bottom: 5px; }
          .value { font-size: 14px; color: #111111; white-space: pre-wrap; }
          .ticket-id { font-family: monospace; font-size: 13px; background: #f0ebfd; color: #783ae6; padding: 4px 8px; border-radius: 4px; font-weight: 600; }
          .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; background: #783ae6; color: #ffffff; }
          .action-box { margin-top: 20px; padding: 16px 20px; background: #f0ebfd; border-radius: 8px; border-left: 4px solid #783ae6; font-size: 14px; color: #111111; }
          .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 20px; }
          .footer a { color: #783ae6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫&nbsp; New Support Ticket</h1>
          </div>
          <div class="content">
            <div class="info-box"><p class="label">Ticket ID</p><span class="ticket-id">${ticketId}</span></div>
            <div class="info-box"><p class="label">User</p><p class="value">${userEmail}</p></div>
            <div class="info-box"><p class="label">Subject</p><p class="value">${subject}</p></div>
            <div class="info-box"><p class="label">Category</p><p class="value" style="text-transform:capitalize">${category.replace("-", " ")}</p></div>
            <div class="info-box"><p class="label">Priority</p><span class="priority-badge">${priorityLabels[priority] ?? priority}</span></div>
            <div class="info-box"><p class="label">Description</p><p class="value">${description}</p></div>
            <div class="info-box"><p class="label">Submitted at</p><p class="value">${new Date().toLocaleString()}</p></div>
            <div class="action-box">⚡ <strong>Action required:</strong> ${priority === "urgent" ? "Respond within 24 hours!" : "Reply within 24–48 hours."}</div>
          </div>
          <div class="footer"><p>FloMCP &middot; <a href="https://flomcp.com">flomcp.com</a></p></div>
        </div>
      </body>
    </html>
  `;
}

function getUserConfirmationEmail(
  ticketId: string,
  subject: string,
  priority: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #111111; margin: 0; padding: 0; background: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #783ae6; color: #ffffff; padding: 28px 30px; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
          .content { background: #f7f7f7; padding: 28px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e8e8e8; border-top: none; }
          .info-box { background: #ffffff; padding: 16px 20px; border-radius: 8px; margin: 10px 0; border: 1px solid #e8e8e8; border-left: 4px solid #783ae6; }
          .info-box p { margin: 0; }
          .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #888888; margin-bottom: 5px; }
          .value { font-size: 14px; color: #111111; }
          .ticket-id { font-family: monospace; font-size: 13px; background: #f0ebfd; color: #783ae6; padding: 4px 8px; border-radius: 4px; font-weight: 600; }
          .action-box { margin-top: 20px; padding: 16px 20px; background: #f0ebfd; border-radius: 8px; border-left: 4px solid #783ae6; font-size: 14px; color: #111111; }
          .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 20px; }
          .footer a { color: #783ae6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅&nbsp; Support Ticket Received</h1>
          </div>
          <div class="content">
            <p style="font-size: 15px; color: #111111;">Thanks for reaching out! We've received your request and will get back to you soon.</p>
            <div class="info-box"><p class="label">Ticket ID</p><span class="ticket-id">${ticketId}</span></div>
            <div class="info-box"><p class="label">Subject</p><p class="value">${subject}</p></div>
            <div class="action-box">🕐 <strong>Expected response:</strong> ${priority === "urgent" || priority === "high" ? "Within 24 hours" : "Within 24–48 hours"}</div>
            <p style="margin-top: 20px; font-size: 14px; color: #888888;">You can view your ticket status in the <strong>Support</strong> section of your dashboard.</p>
          </div>
          <div class="footer"><p>FloMCP &middot; <a href="https://flomcp.com">flomcp.com</a></p></div>
        </div>
      </body>
    </html>
  `;
}

// ─── POST — Create ticket ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rl = checkRateLimit(`support:${ip}`, SUPPORT_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rl.retryAfterSeconds} seconds.` },
      { status: 429 }
    );
  }

  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, description, priority } = body as {
      subject?: string;
      category?: string;
      description?: string;
      priority?: string;
    };

    // Validate
    if (!subject || subject.trim().length < 3) {
      return NextResponse.json({ error: "Subject must be at least 3 characters." }, { status: 400 });
    }
    if (!category || !VALID_CATEGORIES.includes(category as Category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: "Description must be at least 10 characters." }, { status: 400 });
    }
    if (!priority || !VALID_PRIORITIES.includes(priority as Priority)) {
      return NextResponse.json({ error: "Invalid priority." }, { status: 400 });
    }

    // Sanitise lengths
    const cleanSubject = subject.trim().slice(0, 200);
    const cleanDescription = description.trim().slice(0, 5000);

    // Insert ticket
    const { data: ticket, error: insertError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: cleanSubject,
        category,
        description: cleanDescription,
        priority,
        status: "open",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Support ticket insert error:", insertError);
      const msg = insertError.code === "42P01"
        ? "Support table not set up yet. Please run the database migration."
        : "Failed to create ticket.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const userEmail = user.email ?? "unknown";
    const adminEmail = process.env.SUPPORT_EMAIL || "support@flomcp.com";
    const shortId = ticket.id.slice(0, 8).toUpperCase();

    // Fire emails (non-blocking failures)
    const adminSubjectPrefix = category === "bug" ? "[BUG TICKET]" : "[SUPPORT]";
    await Promise.allSettled([
      adminEmail
        ? sendEmail({
            to: adminEmail,
            subject: `${adminSubjectPrefix} ${cleanSubject}`,
            html: getAdminSupportEmail(shortId, userEmail, cleanSubject, category, priority, cleanDescription),
          })
        : Promise.resolve(),
      sendEmail({
        to: userEmail,
        subject: `Support Ticket Received — #${shortId}`,
        html: getUserConfirmationEmail(shortId, cleanSubject, priority),
      }),
    ]);

    // In-app notification — fire-and-forget
    const admin = createAdminClient();
    const slaLabel = priority === "urgent" || priority === "high" ? "24 hours" : "24–48 hours";
    admin.from("notifications").insert({
      user_id: user.id,
      type: "system_message",
      title: "Support Ticket Received",
      body: `We've received your ticket #${shortId} ("${cleanSubject.slice(0, 60)}"). We'll review it and get back to you within ${slaLabel}.`,
    }).then();

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    console.error("Support POST error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ─── GET — Fetch user's tickets ───────────────────────────────────────────────

export async function GET() {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: tickets, error } = await supabase
      .from("support_tickets")
      .select("id, subject, category, description, priority, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Table not yet created → return empty list gracefully
      if (error.code === "42P01") {
        return NextResponse.json({ tickets: [] });
      }
      console.error("Support GET error:", error);
      return NextResponse.json({ error: "Failed to fetch tickets." }, { status: 500 });
    }

    return NextResponse.json({ tickets: tickets ?? [] });
  } catch (err) {
    console.error("Support GET error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

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
  const priorityColors: Record<string, string> = {
    low: "#6c757d",
    medium: "#ffc107",
    high: "#ff9800",
    urgent: "#dc3545",
  };

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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
          .priority-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: bold; color: white; background: ${priorityColors[priority] ?? "#6c757d"}; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
          .ticket-id { font-family: monospace; font-size: 13px; background: #e9ecef; padding: 4px 8px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 22px;">🎫 New Support Ticket</h1>
          </div>
          <div class="content">
            <div class="info-box">
              <p style="margin: 0 0 6px 0;"><strong>Ticket ID:</strong></p>
              <span class="ticket-id">${ticketId}</span>
            </div>
            <div class="info-box">
              <p style="margin: 0 0 6px 0;"><strong>📧 User:</strong></p>
              <p style="margin: 0; color: #667eea;">${userEmail}</p>
            </div>
            <div class="info-box">
              <p style="margin: 0 0 6px 0;"><strong>📌 Subject:</strong></p>
              <p style="margin: 0; font-size: 16px;">${subject}</p>
            </div>
            <div class="info-box">
              <p style="margin: 0 0 6px 0;"><strong>🏷️ Category:</strong></p>
              <p style="margin: 0; text-transform: capitalize;">${category.replace("-", " ")}</p>
            </div>
            <div class="info-box">
              <p style="margin: 0 0 8px 0;"><strong>⚡ Priority:</strong></p>
              <span class="priority-badge">${priorityLabels[priority] ?? priority}</span>
            </div>
            <div class="info-box">
              <p style="margin: 0 0 6px 0;"><strong>📝 Description:</strong></p>
              <p style="margin: 0; white-space: pre-wrap;">${description}</p>
            </div>
            <div class="info-box">
              <p style="margin: 0 0 6px 0;"><strong>⏰ Submitted:</strong></p>
              <p style="margin: 0;">${new Date().toLocaleString()}</p>
            </div>
            <div style="margin-top: 20px; padding: 16px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                ⚡ <strong>Action Required:</strong> ${priority === "urgent" ? "Respond within 24 hours!" : "Reply within 24-48 hours."}
              </p>
            </div>
          </div>
          <div class="footer">
            <p>FloMCP Support System</p>
          </div>
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
          .ticket-id { font-family: monospace; font-size: 13px; background: #e9ecef; padding: 4px 8px; border-radius: 4px; }
          .success-box { background: #e8f5e9; padding: 20px; border-radius: 8px; border-left: 4px solid #4caf50; margin-top: 20px; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 22px;">✅ Support Ticket Received</h1>
          </div>
          <div class="content">
            <p style="font-size: 16px;">Thanks for reaching out! We've received your support request and will get back to you soon.</p>
            <div class="info-box">
              <p style="margin: 0 0 6px 0;"><strong>Ticket ID:</strong></p>
              <span class="ticket-id">${ticketId}</span>
            </div>
            <div class="info-box">
              <p style="margin: 0 0 6px 0;"><strong>📌 Subject:</strong></p>
              <p style="margin: 0;">${subject}</p>
            </div>
            <div class="success-box">
              <p style="margin: 0; font-size: 14px; color: #2e7d32;">
                🕐 <strong>Expected response time:</strong> ${priority === "urgent" || priority === "high" ? "Within 24 hours" : "Within 24-48 hours"}
              </p>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #6c757d;">
              You can view your ticket status anytime in the <strong>Support</strong> section of your dashboard.
            </p>
          </div>
          <div class="footer">
            <p>FloMCP — Build MCP Servers in Minutes</p>
          </div>
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
    const adminEmail = process.env.ADMIN_EMAIL ?? "";
    const shortId = ticket.id.slice(0, 8).toUpperCase();

    // Fire emails (non-blocking failures)
    await Promise.allSettled([
      adminEmail
        ? sendEmail({
            to: adminEmail,
            subject: `[${priority.toUpperCase()}] New Support Ticket: ${cleanSubject}`,
            html: getAdminSupportEmail(shortId, userEmail, cleanSubject, category, priority, cleanDescription),
          })
        : Promise.resolve(),
      sendEmail({
        to: userEmail,
        subject: `Support Ticket Received — #${shortId}`,
        html: getUserConfirmationEmail(shortId, cleanSubject, priority),
      }),
    ]);

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

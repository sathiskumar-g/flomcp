import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { validateEmail } from "@/lib/validate-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, summary, description } = body as {
      email?: string;
      summary?: string;
      description?: string;
    };

    // 3-layer email validation: regex + disposable blocklist + MX record check
    const emailCheck = await validateEmail(email ?? "");
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }
    if (!summary || summary.trim().length < 3) {
      return NextResponse.json({ error: "Query summary is required." }, { status: 400 });
    }
    if (!description || description.trim().length < 10) {
      return NextResponse.json({ error: "Please provide a description (min 10 characters)." }, { status: 400 });
    }

    const cleanEmail = email!.trim();
    const cleanSummary = summary.trim().slice(0, 120);
    const cleanDescription = description.trim();
    const submittedAt = new Date().toLocaleString();

    const supportEmail = process.env.SUPPORT_EMAIL || "support@flomcp.com";
    const subject = `[SUPPORT][QUERY] ${cleanSummary}`;

    // ── Admin notification email ──────────────────────────────────────────
    const adminHtml = `<!DOCTYPE html>
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
    .action-box { margin-top: 20px; padding: 16px 20px; background: #f0ebfd; border-radius: 8px; border-left: 4px solid #783ae6; font-size: 14px; color: #111111; }
    .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 20px; }
    .footer a { color: #783ae6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>✉️&nbsp; New Contact Query</h1></div>
    <div class="content">
      <div class="info-box"><p class="label">From</p><p class="value">${cleanEmail}</p></div>
      <div class="info-box"><p class="label">Query summary</p><p class="value">${cleanSummary}</p></div>
      <div class="info-box"><p class="label">Description</p><p class="value">${cleanDescription}</p></div>
      <div class="info-box"><p class="label">Submitted at</p><p class="value">${submittedAt}</p></div>
      <div class="action-box">⚡ <strong>Action required:</strong> Reply to <strong>${cleanEmail}</strong> within 24 hours.</div>
    </div>
    <div class="footer"><p>FloMCP &middot; <a href="https://flomcp.com">flomcp.com</a></p></div>
  </div>
</body>
</html>`;

    // ── User confirmation email ────────────────────────────────────────────
    const userHtml = `<!DOCTYPE html>
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
    .action-box { margin-top: 20px; padding: 16px 20px; background: #f0ebfd; border-radius: 8px; border-left: 4px solid #783ae6; font-size: 14px; color: #111111; }
    .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 20px; }
    .footer a { color: #783ae6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>✅&nbsp; We received your message</h1></div>
    <div class="content">
      <p style="font-size: 15px; margin: 0 0 20px 0;">Thanks for reaching out! We've received your query and will get back to you within 24 hours.</p>
      <div class="info-box"><p class="label">Your query</p><p class="value">${cleanSummary}</p></div>
      <div class="info-box"><p class="label">Description</p><p class="value">${cleanDescription}</p></div>
      <div class="action-box">🕐 <strong>Expected response:</strong> Within 24 hours to <strong>${cleanEmail}</strong></div>
      <p style="margin-top: 20px; font-size: 13px; color: #888888;">If you need urgent help you can also reach us at <a href="mailto:support@flomcp.com" style="color: #783ae6;">support@flomcp.com</a></p>
    </div>
    <div class="footer"><p>FloMCP &middot; <a href="https://flomcp.com">flomcp.com</a></p></div>
  </div>
</body>
</html>`;

    // Send both emails — fire admin first, user confirmation second (fire-and-forget)
    const adminResult = await sendEmail({ to: supportEmail, subject, html: adminHtml });
    if (!adminResult.success) {
      console.error("❌ Contact admin email failed:", adminResult.error);
      return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
    }
    console.log(`✅ Contact query sent to ${supportEmail} — subject: ${subject}`);

    // User confirmation — fire-and-forget, don't fail the request if this bounces
    sendEmail({
      to: cleanEmail,
      subject: "We received your message — FloMCP Support",
      html: userHtml,
    }).then((r) => {
      if (!r.success) console.error("❌ Contact user confirmation failed:", r.error);
      else console.log(`✅ Contact confirmation sent to ${cleanEmail}`);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact API error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

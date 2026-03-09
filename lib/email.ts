import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  // DISABLE_EMAILS=true blocks all outgoing email (use during local dev/testing)
  if (process.env.DISABLE_EMAILS === 'true') {
    console.log(`📭 [sendEmail] DISABLED — skipping: "${subject}" → ${to}`);
    return { success: true, data: null };
  }

  const senderEmail = process.env.NOREPLY_EMAIL || 'no-reply@flomcp.com';
  const fromAddress = `FloMCP <${senderEmail}>`;
  try {
    console.log('📨 Sending email via Resend...');
    console.log('From:', fromAddress);
    console.log('To:', to);
    console.log('Subject:', subject);
    
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('❌ Resend API error object:', error);
      return { success: false, error };
    }

    console.log('✅ Resend email sent, id:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Resend threw exception:', error);
    return { success: false, error };
  }
}

// ─── Shared HTML helpers ────────────────────────────────────────────────────

const BRAND = '#783ae6';

function emailShell(headerEmoji: string, headerTitle: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #111111; margin: 0; padding: 0; background: #ffffff; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #783ae6; color: #ffffff; padding: 28px 30px; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
    .content { background: #f7f7f7; padding: 28px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e8e8e8; border-top: none; }
    .type-badge { display: inline-block; background: #783ae6; color: #ffffff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 18px; }
    .info-box { background: #ffffff; padding: 16px 20px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #783ae6; border: 1px solid #e8e8e8; border-left: 4px solid #783ae6; }
    .info-box p { margin: 0; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #888888; margin-bottom: 5px !important; }
    .value { font-size: 14px; color: #111111; white-space: pre-wrap; }
    .action-box { margin-top: 20px; padding: 16px 20px; background: #f0ebfd; border-radius: 8px; border-left: 4px solid #783ae6; font-size: 14px; color: #111111; }
    .divider { height: 1px; background: #e8e8e8; margin: 20px 0; }
    .footer { text-align: center; color: #888888; font-size: 12px; margin-top: 20px; }
    .footer a { color: #783ae6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${headerEmoji}&nbsp; ${headerTitle}</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>FloMCP &middot; <a href="https://flomcp.com">flomcp.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

function infoBox(label: string, value: string) {
  if (!value) return '';
  return `<div class="info-box"><p class="label">${label}</p><p class="value">${value}</p></div>`;
}

// ─── Freelance & Enterprise — shared template ──────────────────────────────
// `subject` is the full Gmail label subject e.g. "[ENTERPRISE INTEREST] Custom MCP..."
// urgency covers both freelance values (low/medium/high/urgent) and
// enterprise timeline values (asap/weeks/month/planning)

export function getSubmissionEmail(
  subject: string,
  email: string,
  description: string,
  urgency: string,
  additionalEmail?: string,
) {
  const urgencyLabels: Record<string, string> = {
    // freelance
    low:     '🟢 Low — Planning phase',
    medium:  '🟡 Medium — Next few weeks',
    high:    '🟠 High — ASAP',
    urgent:  '🔴 Urgent — Need this week',
    // enterprise timeline
    asap:     '🔴 ASAP — need this week',
    weeks:    '🟠 A few weeks',
    month:    '🟡 Within a month',
    planning: '🟢 Still planning',
  };

  const isEnterprise = subject.toLowerCase().includes('enterprise enquiry');

  const body = `
    <div class="type-badge">${isEnterprise ? 'Enterprise Enquiry' : 'Custom Dev Request'}</div>
    ${infoBox('From', email)}
    ${additionalEmail ? infoBox('Additional Email', additionalEmail) : ''}
    ${infoBox(isEnterprise ? 'Requirements' : 'Project description', description || '(none provided)')}
    ${infoBox(isEnterprise ? 'Timeline' : 'Urgency', urgencyLabels[urgency] ?? urgency)}
    ${infoBox('Submitted at', new Date().toLocaleString())}
    <div class="action-box">⚡ <strong>Action required:</strong> Respond within 24 hours.</div>
  `;
  return emailShell(
    isEnterprise ? '🏢' : '🛠️',
    isEnterprise ? 'Enterprise Enquiry' : 'Custom MCP Development Request',
    body,
  );
}

// ─── Pro Interest ───────────────────────────────────────────────────────────

export function getProInterestEmail(
  email: string,
  useCase: string,
  volume: string,
  features: string,
) {
  const body = `
    <div class="type-badge">Pro Early Access</div>
    ${infoBox('Email', email)}
    ${infoBox('Use case / what they build', useCase || '(none provided)')}
    ${infoBox('Servers per month', volume || '(not specified)')}
    ${features ? infoBox('Desired features', features) : ''}
    ${infoBox('Submitted at', new Date().toLocaleString())}
    <div class="action-box">📋 Add to early access list and reply within 24h.</div>
  `;
  return emailShell(
    '👑',
    'Pro Plan — Early Access Signup',
    body,
  );
}

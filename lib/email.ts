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
    
    const data = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
    });

    console.log('✅ Resend API response:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Resend API error:', error);
    return { success: false, error };
  }
}

// Email template for custom development request
export function getFreelanceRequestEmail(
  email: string,
  description: string,
  urgency: string
) {
  const urgencyColors = {
    low: '#6c757d',
    medium: '#ffc107',
    high: '#ff9800',
    urgent: '#dc3545',
  };

  const urgencyLabels = {
    low: '🟢 Low - Planning phase',
    medium: '🟡 Medium - Next few weeks',
    high: '🟠 High - ASAP',
    urgent: '🔴 Urgent - Need this week',
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .badge { display: inline-block; background: #dc3545; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; margin-bottom: 20px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f5576c; }
          .urgency-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; background: ${urgencyColors[urgency as keyof typeof urgencyColors]}; color: white; }
          .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🚨 Custom Development Request!</h1>
          </div>
          <div class="content">
            <div class="badge">FREELANCE OPPORTUNITY</div>
            
            <div class="info-box">
              <p style="margin: 0 0 10px 0;"><strong>📧 Email:</strong></p>
              <p style="margin: 0; font-size: 16px; color: #f5576c;">${email}</p>
            </div>

            <div class="info-box">
              <p style="margin: 0 0 10px 0;"><strong>📝 Project Description:</strong></p>
              <p style="margin: 0; white-space: pre-wrap;">${description}</p>
            </div>

            <div class="info-box">
              <p style="margin: 0 0 10px 0;"><strong>⚡ Urgency Level:</strong></p>
              <span class="urgency-badge">${urgencyLabels[urgency as keyof typeof urgencyLabels]}</span>
            </div>

            <div class="info-box">
              <p style="margin: 0 0 10px 0;"><strong>⏰ Submitted:</strong></p>
              <p style="margin: 0;">${new Date().toLocaleString()}</p>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                ⚡ <strong>Action Required:</strong> ${urgency === 'urgent' ? 'Respond within 24 hours!' : 'Reply to this lead within 24-48 hours'}
              </p>
            </div>
          </div>
          <div class="footer">
            <p>FloMCP - Custom MCP Development Services</p>
            <p>View all submissions in your <a href="https://supabase.com/dashboard" style="color: #f5576c;">Supabase Dashboard</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

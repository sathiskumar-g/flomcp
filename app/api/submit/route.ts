import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import {
  sendEmail,
  getSubmissionEmail,
  getProInterestEmail,
} from '@/lib/email';
import { validateEmail } from '@/lib/validate-email';

export async function POST(request: Request) {
  const supabase = createAdminClient();
  try {
    const body = await request.json();
    const { email, problem, interest, urgency, description, features, userAgent } = body;

    // Validate required fields
    if (!email || !interest) {
      return NextResponse.json(
        { error: 'Email and interest type are required' },
        { status: 400 }
      );
    }

    // 3-layer email validation: regex + disposable blocklist + MX record check
    const emailCheck = await validateEmail(String(email));
    if (!emailCheck.valid) {
      return NextResponse.json({ error: emailCheck.error }, { status: 400 });
    }

    // Validate interest type whitelist
    const ALLOWED_TYPES = ['freelance', 'pro_interest', 'enterprise'];
    if (!ALLOWED_TYPES.includes(interest)) {
      return NextResponse.json({ error: 'Invalid interest type' }, { status: 400 });
    }

    // Sanitize inputs
    const sanitizedEmail = String(email).toLowerCase().trim().slice(0, 254);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('submissions')
      .insert([
        {
          email: sanitizedEmail,
          problem: problem || null,
          interest_type: interest,
          urgency: urgency || null,
          description: description || null,
          user_agent: userAgent || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    // Send email notification → always founder@flomcp.com
    if (process.env.RESEND_API_KEY) {
      try {
        const founderEmail = process.env.FOUNDER_EMAIL || 'founder@flomcp.com';
        const featuresStr = Array.isArray(features) ? features.join(', ') : (features || '');

        const subjectMap: Record<string, string> = {
          freelance:    '[ENTERPRISE INTEREST] Custom MCP Development Request',
          pro_interest: '[PRO INTEREST] Early Access Signup',
          enterprise:   '[ENTERPRISE INTEREST] Enterprise Enquiry',
        };
        const subject = subjectMap[interest] ?? '[SUBMISSION] New FloMCP Form Submission';

        let emailHtml: string;
        if (interest === 'pro_interest') {
          emailHtml = getProInterestEmail(email, description || '', urgency || '', featuresStr);
        } else {
          // freelance and enterprise — same template, subject distinguishes them
          emailHtml = getSubmissionEmail(subject, email, description || problem || '', urgency || '');
        }

        const result = await sendEmail({ to: founderEmail, subject, html: emailHtml });
        if (result.success) {
          console.log(`✅ Notification sent to ${founderEmail}`);
        } else {
          console.error('❌ Email failed:', result.error);
        }
      } catch (emailError) {
        console.error('❌ Email notification error:', emailError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Submission saved successfully',
      data 
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

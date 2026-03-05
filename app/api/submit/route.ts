import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { sendEmail, getFreelanceRequestEmail } from '@/lib/email';

export async function POST(request: Request) {
  const supabase = createServerClient();
  try {
    const body = await request.json();
    const { email, problem, interest, urgency, description, userAgent } = body;

    // Validate required fields
    if (!email || !interest) {
      return NextResponse.json(
        { error: 'Email and interest type are required' },
        { status: 400 }
      );
    }

    // Server-side email format validation
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(String(email).toLowerCase().trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
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

    // Send email notification to founder@flomcp.com for all submission types
    if (process.env.RESEND_API_KEY) {
      try {
        const founderEmail = process.env.FOUNDER_EMAIL || 'founder@flomcp.com';

        const emailHtml = getFreelanceRequestEmail(email, description || '', urgency || 'medium');

        const subjectMap: Record<string, string> = {
          freelance:    '[ENTERPRISE INTEREST] Custom MCP Development Request',
          pro_interest: '[PRO INTEREST] Early Access Signup',
          enterprise:   '[ENTERPRISE INTEREST] Enterprise Enquiry',
        };
        const subject = subjectMap[interest] ?? '📬 New FloMCP Submission';

        const result = await sendEmail({ to: founderEmail, subject, html: emailHtml });
        if (result.success) {
          console.log('✅ Email sent to', founderEmail);
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

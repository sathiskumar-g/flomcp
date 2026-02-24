import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { sendEmail, getProductInterestEmail, getFreelanceRequestEmail } from '@/lib/email';

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

    // Insert into Supabase
    const { data, error } = await supabase
      .from('submissions')
      .insert([
        {
          email,
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

    // Send email notification (if Resend is configured)
    if (process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL) {
      try {
        console.log('📧 Attempting to send email notification...');
        console.log('To:', process.env.NOTIFICATION_EMAIL);
        
        const emailHtml = interest === 'product'
          ? getProductInterestEmail(email, problem || '')
          : getFreelanceRequestEmail(email, description || '', urgency || 'medium');

        const subject = interest === 'product'
          ? '🎉 New FloMCP Product Interest'
          : `🚨 Custom MCP Development Request [${urgency?.toUpperCase()}]`;

        const result = await sendEmail({
          to: process.env.NOTIFICATION_EMAIL,
          subject,
          html: emailHtml,
        });

        if (result.success) {
          console.log('✅ Email sent successfully!', result.data);
        } else {
          console.error('❌ Email failed:', result.error);
        }
      } catch (emailError) {
        // Don't fail the request if email fails
        console.error('❌ Email notification error:', emailError);
      }
    } else {
      console.log('⚠️ Email not configured. Missing:', {
        hasApiKey: !!process.env.RESEND_API_KEY,
        hasNotificationEmail: !!process.env.NOTIFICATION_EMAIL
      });
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

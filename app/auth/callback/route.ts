/**
 * Auth Callback Handler
 * 
 * Handles the OAuth callback and email verification redirect from Supabase
 * - Processes the auth code from URL
 * - Exchanges it for a session
 * - Redirects to dashboard on success or error page on failure
 * 
 * Cost-conscious: No additional API calls, pure redirect handling
 */

import { createServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = createServerClient();
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        // Redirect to error page with message
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/error?message=${encodeURIComponent(error.message)}`
        );
      }

      if (data.session) {
        // Check if this is email verification (user just verified email)
        const { data: userData } = await supabase.auth.getUser();
        
        if (userData.user) {
          // User verified their email successfully
          // Supabase automatically marks email_confirmed_at
          // Redirect to dashboard with success message
          return NextResponse.redirect(
            `${requestUrl.origin}${next}?verified=true`
          );
        }
      }

      // Success - redirect to intended destination
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    } catch (err) {
      console.error('Unexpected auth error:', err);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?message=Authentication failed`
      );
    }
  }

  // No code present, redirect to home
  return NextResponse.redirect(requestUrl.origin);
}

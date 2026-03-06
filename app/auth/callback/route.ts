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
  const rawNext = requestUrl.searchParams.get('next') || '/dashboard';
  // Sanitize: must start with / and not // (prevents open redirect)
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  if (code) {
    const supabase = createServerClient();
    
    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        // Use error codes, not raw messages (messages leak in URL/logs/referrer)
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/error?error=auth_exchange_failed`
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
        `${requestUrl.origin}/auth/error?error=auth_exchange_failed`
      );
    }
  }

  // No code present, redirect to home
  return NextResponse.redirect(requestUrl.origin);
}

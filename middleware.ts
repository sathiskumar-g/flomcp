import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth middleware — token refresh + route protection.
 *
 * Strategy:
 * - If NO session cookie → skip ALL network calls (zero latency for anonymous users)
 * - If session cookie EXISTS → call getUser() with a 5-second timeout.
 *   On success the refreshed token is forwarded via request cookies so API
 *   routes can call getSession() locally without any network call.
 * - On failure → fall back to getSession() (local JWT decode, no network).
 *
 * The matcher now includes /api/* so that token refresh happens BEFORE API
 * routes run. API routes themselves use getSession() (instant, no network).
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // 5-second fetch timeout — fail fast so the request isn't blocked for 10s+
        fetch: (url: string | URL | Request, options?: RequestInit) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          return fetch(url, { ...options, signal: controller.signal }).finally(() =>
            clearTimeout(timer)
          );
        },
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check for a Supabase session cookie without any network call.
  const hasSessionCookie = request.cookies.getAll().some(
    (c) =>
      (c.name.includes("-auth-token") || c.name.includes("-code-verifier")) &&
      c.value.length > 0
  );

  let user = null;

  if (hasSessionCookie) {
    // Session cookie present — try getUser() to refresh the access token.
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Network timeout or error — fall back to local session decode.
      // The token won't refresh this request, but user won't be kicked out.
      try {
        const { data } = await supabase.auth.getSession();
        user = data.session?.user ?? null;
      } catch {
        user = null;
      }
    }
  }

  // Protect /dashboard — redirect unauthenticated users to signin
  if (!user && !hasSessionCookie && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/signin";
    return NextResponse.redirect(url);
  }

  // Signed-in users on auth pages → send to dashboard
  if (
    user &&
    (request.nextUrl.pathname === "/auth/signin" ||
      request.nextUrl.pathname === "/auth/signup" ||
      request.nextUrl.pathname === "/login")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*",
    "/login",
    "/api/:path*",
  ],
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth middleware — token refresh + route protection.
 *
 * Strategy:
 * - If NO session cookie → skip ALL network calls (zero latency for anonymous users)
 * - If session cookie EXISTS → call getSession() which decodes JWT locally.
 *   Only makes a network call when the token is expired and needs refresh.
 *   Much faster than getUser() which ALWAYS hits Supabase.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // 3-second fetch timeout — only used for token refresh (expired JWT).
        // getSession() is instant for fresh tokens (no network call).
        fetch: (url: string | URL | Request, options?: RequestInit) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3000);
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
    // getSession() decodes the JWT locally — instant, zero network calls
    // for fresh tokens. Only makes a network call if the access token is
    // expired and needs to be refreshed via the refresh token.
    // Much faster than getUser() which ALWAYS calls the Supabase auth server.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user ?? null;
    } catch {
      // Token refresh failed (network down) — treat as unauthenticated.
      // User will be redirected to signin and can re-authenticate.
      user = null;
    }
  }

  // Protect /dashboard — redirect unauthenticated users to signin
  // Check ONLY !user (not hasSessionCookie). If cookie exists but is corrupted/expired
  // and both getUser() and getSession() failed, user=null → redirect to signin.
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
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
    // No "/api/:path*" — API routes handle their own auth.
    // Running middleware on every API call added unnecessary latency.
  ],
};

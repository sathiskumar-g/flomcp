import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase auth middleware — required for session refresh.
 *
 * Without this, Supabase access tokens expire and all server-side
 * `supabase.auth.getUser()` calls return null → Unauthorized errors.
 *
 * This middleware:
 * 1. Refreshes the Supabase session on every request
 * 2. Redirects unauthenticated users away from /dashboard routes
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write updated cookies to the outgoing response
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — this re-sets the cookie if the token was refreshed
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // If Supabase is unreachable, fail open (don't block all requests)
  }

  // Protect all /dashboard routes — redirect to /auth/signin if not authenticated
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const signinUrl = request.nextUrl.clone();
    signinUrl.pathname = "/auth/signin";
    return NextResponse.redirect(signinUrl);
  }

  // Redirect authenticated users away from auth pages back to dashboard
  if (
    user &&
    (request.nextUrl.pathname === "/auth/signin" ||
      request.nextUrl.pathname === "/auth/signup" ||
      request.nextUrl.pathname === "/login")
  ) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Only run on dashboard pages and auth pages — not on API routes,
     * static files, or Next.js internals.
     */
    "/dashboard/:path*",
    "/auth/:path*",
    "/login",
  ],
};

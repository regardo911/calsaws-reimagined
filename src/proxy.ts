// Session refresh + role-based route gating (Next 16 proxy convention).
// Role comes from JWT app_metadata (server-set only; self-signups have none => applicant).
// Server components re-check roles; RLS enforces data access regardless.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const STAFF = ['worker', 'supervisor', 'admin'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const role: string | null = user ? (user.app_metadata?.calsaws_role ?? 'applicant') : null;
  const path = request.nextUrl.pathname;
  // Carry the session cookies refreshed by updateSession/getUser onto every redirect,
  // otherwise a fresh NextResponse.redirect drops them and forces intermittent logouts.
  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };
  const to = (p: string) => redirectTo(new URL(p, request.url));

  const needsAuth = (p: string) =>
    p.startsWith('/worker') || p.startsWith('/case') || p.startsWith('/reports') ||
    p.startsWith('/supervisor') || p.startsWith('/admin') || p === '/portal' || p.startsWith('/portal/noa');

  if (needsAuth(path) && !user) {
    const login = new URL('/login', request.url);
    login.searchParams.set('next', path);
    return redirectTo(login);
  }
  if ((path.startsWith('/worker') || path.startsWith('/case') || path.startsWith('/reports')) && role && !STAFF.includes(role)) return to('/portal');
  if (path.startsWith('/supervisor') && role && !['supervisor', 'admin'].includes(role)) return to(STAFF.includes(role) ? '/worker' : '/portal');
  if (path.startsWith('/admin') && role !== 'admin' && user) return to(STAFF.includes(role!) ? '/worker' : '/portal');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|ico|css|js)$).*)'],
};

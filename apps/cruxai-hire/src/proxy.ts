import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/recruiters', '/candidates', '/questions', '/settings'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // TODO: tighten this — only skip auth when the invite code is actually valid
  // (requires an async DB lookup here, or a signed/verifiable invite token).
  // For now, any `invite` param bypasses the auth gate so candidates can access
  // /questions/[id]?invite=[code] without a recruiter account.
  const inviteCode = request.nextUrl.searchParams.get('invite');
  if (pathname.startsWith('/questions') && inviteCode) return NextResponse.next();

  const session =
    request.cookies.get('__Secure-better-auth.session_token') ??
    request.cookies.get('better-auth.session_token');
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/recruiters/:path*', '/candidates/:path*', '/questions/:path*', '/settings'],
};

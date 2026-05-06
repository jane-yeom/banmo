import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = [
  '/mypage',
  '/profile/edit',
  '/chat',
  '/admin',
  '/jobs/write',
  '/favorites',
  '/notifications',
  '/board/write',
];

const AUTH_ONLY = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('accessToken')?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  console.log('[Middleware] path:', pathname, 'token:', !!token);

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/mypage/:path*',
    '/profile/edit/:path*',
    '/chat/:path*',
    '/admin/:path*',
    '/jobs/write/:path*',
    '/favorites/:path*',
    '/notifications/:path*',
    '/board/write/:path*',
    '/login',
    '/signup',
  ],
};

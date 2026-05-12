import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = [
  '/mypage',
  '/profile/edit',
  '/chat',
  '/jobs/write',
  '/favorites',
  '/notifications',
  '/board/write',
  '/write',
];

const AUTH_ONLY = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 관리자 공개 페이지는 항상 허용
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname.startsWith('/admin/reset-password')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('accessToken')?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

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
    '/jobs/write/:path*',
    '/favorites/:path*',
    '/notifications/:path*',
    '/board/write/:path*',
    '/write/:path*',
    '/admin/login',
    '/admin/forgot-password',
    '/admin/reset-password',
    '/login',
    '/signup',
  ],
};

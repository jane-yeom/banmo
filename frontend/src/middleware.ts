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
  '/write',
];

const AUTH_ONLY = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 관리자 로그인 페이지는 항상 허용
  if (pathname === '/admin/login') return NextResponse.next();

  const token = request.cookies.get('accessToken')?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  console.log('[Middleware] path:', pathname, 'token:', !!token);

  if (isProtected && !token) {
    // /admin 하위 경로는 /admin/login 으로 리다이렉트
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
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
    '/write/:path*',
    '/login',
    '/signup',
  ],
};

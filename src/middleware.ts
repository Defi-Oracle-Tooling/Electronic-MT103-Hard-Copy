import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { PortalType } from '@/types/auth';

const PORTAL_PATHS: Record<PortalType, string[]> = {
  USER: ['/user', '/transactions', '/reports'],
  EMPLOYEE: ['/employee', '/workflow', '/documents'],
  ADMIN: ['/admin', '/settings', '/system'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token');

  // Public paths
  if (pathname.startsWith('/_next') || pathname === '/login') {
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Portal-specific middleware checks
  if (pathname.startsWith('/admin')) {
    // Admin portal checks
    const userRole = request.cookies.get('user-role');
    if (userRole?.value !== 'ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  const userPortal = request.cookies.get('portal-type')?.value as PortalType;
  const path = pathname.split('/')[1]; // Get first path segment

  // Check if user has access to the portal
  const hasAccess = PORTAL_PATHS[userPortal]?.some(p => pathname.startsWith(p));
  if (!hasAccess) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Additional security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/user/:path*',
    '/employee/:path*',
    '/admin/:path*',
  ],
};

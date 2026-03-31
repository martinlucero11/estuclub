import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define Protected Route Patterns
  const isCluberRoute = pathname.startsWith('/panel-cluber');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/panel-admin');
  const isRiderRoute = pathname.startsWith('/rider');

  // Skip Public Routes
  if (!isCluberRoute && !isAdminRoute && !isRiderRoute) {
    return NextResponse.next();
  }

  // 2. Extract User Info from Cookies (Requires a secure cookie presence)
  // In a real Firebase app, we'd check the Firebase Session Cookie.
  // For this initial structure, we'll implement a 'portero' logic 
  // that redirects users if the role cookie doesn't match.
  const userRole = request.cookies.get('user-role')?.value;
  const isApproved = request.cookies.get('user-approved')?.value === 'true';

  // 3. Protection Logic
  if (isCluberRoute && userRole !== 'supplier' && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isRiderRoute) {
    if (userRole !== 'rider' || !isApproved) {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }

  return NextResponse.next();
}

// Ensure middleware runs only on restricted routes to save compute
export const config = {
  matcher: [
    '/panel-cluber/:path*',
    '/admin/:path*',
    '/panel-admin/:path*',
    '/rider/:path*',
  ],
};

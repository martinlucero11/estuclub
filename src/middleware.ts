import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ESTUCLUB RBAC MIDDLEWARE
 * Protects role-specific routes based on cookies set at login.
 * 
 * Roles: 'user' | 'rider_pending' | 'rider' | 'cluber_pending' | 'cluber' | 'supplier' | 'admin'
 * 
 * Note: This is a first-line defense. Real protection happens client-side
 * via useUser() hook checking Firestore role. Edge Runtime can't query Firestore.
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isCluberRoute = pathname.startsWith('/panel-cluber');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/panel-admin') || pathname.startsWith('/verify');
  // /rider itself is public (login + signup). Only sub-routes are protected.
  const isRiderRoute = pathname.startsWith('/rider/');

  if (!isCluberRoute && !isAdminRoute && !isRiderRoute) {
    return NextResponse.next();
  }

  const userRole = request.cookies.get('user-role')?.value;

  // Admin: only role === 'admin'
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Cluber panel: allow 'supplier', 'cluber', 'cluber_pending', and 'admin'
  if (isCluberRoute) {
    const allowed = ['supplier', 'cluber', 'cluber_pending', 'admin'];
    if (!userRole || !allowed.includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Rider: allow 'rider' and 'admin'. Block 'rider_pending' (needs approval).
  if (isRiderRoute) {
    const allowed = ['rider', 'admin'];
    if (!userRole || !allowed.includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/panel-cluber/:path*',
    '/admin/:path*',
    '/panel-admin/:path*',
    '/verify/:path*',
    '/rider/wallet/:path*',
    '/rider/pedidos/:path*',
    '/rider/perfil/:path*',
  ],
};

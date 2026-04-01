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
  const userRole = request.cookies.get('user-role')?.value;

  // OVERLORD BYPASS: If user is admin, allow EVERYTHING to prevent lockouts.
  if (userRole === 'admin') {
    return NextResponse.next();
  }

  const isCluberRoute = pathname.startsWith('/panel-cluber');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/panel-admin') || pathname.startsWith('/verify');
  const isRiderRoute = pathname.startsWith('/rider/');

  if (!isCluberRoute && !isAdminRoute && !isRiderRoute) {
    return NextResponse.next();
  }

  // Admin routes: already covered by overlord bypass above, but keeping for logic safety
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Cluber panel: allow 'supplier', 'cluber', 'cluber_pending'
  if (isCluberRoute) {
    const allowed = ['supplier', 'cluber', 'cluber_pending'];
    if (!userRole || !allowed.includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Rider: allow 'rider'. Block 'rider_pending' (needs approval).
  if (isRiderRoute) {
    const allowed = ['rider'];
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

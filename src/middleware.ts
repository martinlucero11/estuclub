import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ESTUCLUB MIDDLEWARE - PASSTHROUGH
 * 
 * All role-based protection is handled CLIENT-SIDE via useUser() + layout guards.
 * Edge Runtime cannot read Firestore or Firebase Auth state.
 * The previous cookie-based approach caused infinite redirects because
 * the cookie was never set from the client.
 * 
 * This middleware is intentionally a no-op passthrough.
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};

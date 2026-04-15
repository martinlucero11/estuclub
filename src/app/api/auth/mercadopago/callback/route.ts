import { NextRequest, NextResponse } from 'next/server';

/**
 * Legacy Callback Redirection
 * Redirects older OAuth flows to the new, standardized and diagnostic-rich handler.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const newUrl = new URL('/api/mp/callback', request.url);
    
    // Pass all params (code, state, etc) to the new handler
    searchParams.forEach((value, key) => {
        newUrl.searchParams.set(key, value);
    });

    return NextResponse.redirect(newUrl);
}

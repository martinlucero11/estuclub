import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * Creates a secure, short-lived OAuth state (nonce)
 * to prevent CSRF attacks during the Mercado Pago linking process.
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'Auth context required' }, { status: 401 });
        }

        const stateId = uuidv4();
        
        // Save state to Firestore with a 10-minute expiry
        await adminDb.collection('mp_oauth_states').doc(stateId).set({
            userId,
            used: false,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        const response = NextResponse.json({ stateId });

        // Set secure cookie for cross-origin redirect survival
        // CRITICAL FOR FIREBASE HOSTING: Must be named '__session' to pass through the CDN
        response.cookies.set('__session', stateId, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/',
            maxAge: 600 // 10 minutes
        });


        return response;

    } catch (error: any) {
        console.error('Failed to create OAuth state:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


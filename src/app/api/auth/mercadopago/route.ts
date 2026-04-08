import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import * as admin from 'firebase-admin';

// Mercado Pago OAuth Credentials
const CLIENT_ID = process.env.MP_CLIENT_ID || '';
const CLIENT_SECRET = process.env.MP_CLIENT_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Should contain userId

    // Phase 1: Redirect to MP for Authorization
    if (!code) {
        const userId = searchParams.get('userId');
        if (!userId) return NextResponse.json({ error: 'Missing userId for state' }, { status: 400 });

        const authUrl = `https://auth.mercadopago.com.ar/authorization?client_id=${CLIENT_ID}&response_type=code&platform_id=mp&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${userId}`;
        
        return NextResponse.redirect(authUrl);
    }

    // Phase 2: Callback with Code -> Exchange for Access Token
    try {
        const response = await fetch('https://api.mercadopago.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI
            })
        });

        const data = await response.json();

        if (data.access_token) {
            // Save tokens to Firestore (Preferably encrypted or in a secure subcollection)
            const userId = state || '';
            const userRef = adminDb.collection('users').doc(userId);
            
            await userRef.update({
                mp_linked: true,
                mp_user_id: data.user_id,
                mp_access_token: data.access_token,
                mp_refresh_token: data.refresh_token,
                mp_link_date: admin.firestore.FieldValue.serverTimestamp()
            });

            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/profile?mp_linked=success`);
        } else {
            console.error('MP OAuth Error:', data);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/profile?mp_linked=error`);
        }
    } catch (error) {
        console.error('MP OAuth Request Error:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/profile?mp_linked=error`);
    }
}


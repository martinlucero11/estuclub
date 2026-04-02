export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MP_CLIENT_SECRET, MP_APP_ID, MP_REDIRECT_URI } from '@/lib/mercadopago';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const role = searchParams.get('role'); // 'rider' or 'supplier'
    const uid = searchParams.get('uid');

    if (!code || !uid) {
        return NextResponse.json({ error: 'Missing code or uid' }, { status: 400 });
    }

    try {
        // 1. Exchange code for access token
        const response = await fetch('https://api.mercadopago.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: MP_APP_ID,
                client_secret: MP_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: MP_REDIRECT_URI
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('MP OAuth Error:', data);
            return NextResponse.json({ error: data.message }, { status: 500 });
        }

        // 2. Save MP data to user's role document or mark as linked
        // Note: For now we'll store it in the user's main profile or a dedicated subcollection
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.update({
            mp_linked: true,
            mp_user_id: data.user_id,
            mp_access_token: data.access_token, // Ideally encrypt this if storing long-term
            mp_refresh_token: data.refresh_token,
            updatedAt: new Date()
        });

        // 3. Redirect back to onboarding success
        const redirectUrl = role === 'rider' ? '/be-rider' : '/be-cluber';
        return NextResponse.redirect(new URL(redirectUrl + '?step=success', req.url));

    } catch (error) {
        console.error('Callback Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { MP_CLIENT_SECRET, MP_APP_ID, MP_REDIRECT_URI } from '@/lib/mercadopago';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // The userId passed during authorization

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state (userId)' }, { status: 400 });
    }

    try {
        // 1. Exchange code for credentials
        // POST to https://api.mercadopago.com/oauth/token
        const response = await fetch('https://api.mercadopago.com/oauth/token', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` // Integration token
            },
            body: JSON.stringify({
                client_secret: MP_CLIENT_SECRET,
                client_id: MP_APP_ID,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: MP_REDIRECT_URI
            })
        });

        const credentials = await response.json();

        if (credentials.error) {
            console.error('Mercado Pago OAuth Error:', credentials);
            return NextResponse.json({ error: credentials.message || 'Failed to link account' }, { status: 500 });
        }

        // 2. Save credentials to Firestore (Private Subcollection)
        // Storing sensitive tokens in 'mp_credentials/main' for the user
        const batch = adminDb.batch();
        const userRef = adminDb.collection('users').doc(state);
        const credRef = userRef.collection('private_data').doc('mercadopago');

        batch.set(credRef, {
            access_token: credentials.access_token,
            public_key: credentials.public_key,
            refresh_token: credentials.refresh_token,
            user_id: credentials.user_id,
            live_mode: credentials.live_mode,
            linked_at: new Date()
        }, { merge: true });

        // Update public profile status
        batch.update(userRef, {
            mp_linked: true,
            updatedAt: new Date()
        });

        await batch.commit();

        // 3. Determine if it's a Rider or Cluber to redirect correctly
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        const role = userData?.role || 'user';

        const redirectBase = (role === 'rider') ? '/rider' : '/panel-cluber';
        return NextResponse.redirect(new URL(`${redirectBase}?success=mp_linked`, req.url));

    } catch (error) {
        console.error('MP Callback Internal Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

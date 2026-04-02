import { NextRequest, NextResponse } from 'next/server';
import { updateDoc, doc } from 'firebase/firestore';
import { getFirebaseServices } from '@/firebase/services';

/**
 * Mercado Pago OAuth Callback
 * Handles token exchange and stores credentials in Firestore
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // State contains our userId from the login/onboarding flow

  // 1. Validation
  if (!code || !state) {
    return NextResponse.json({ 
      error: 'Missing required parameters (code or state)',
      received: { code: !!code, state: !!state }
    }, { status: 400 });
  }

  try {
    // 2. Initialize Firebase (Server-side)
    const { firestore: db } = getFirebaseServices();

    // 3. Exchange Code for Access Token
    // We use the credentials from .env.local
    const mpTokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        client_secret: process.env.MP_CLIENT_SECRET, // Using the real Client Secret now
        client_id: process.env.MP_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`,
      }),
    });

    if (!mpTokenResponse.ok) {
      const errorData = await mpTokenResponse.json();
      console.error('Mercado Pago OAuth Exchange Failed:', errorData);
      return NextResponse.json({ 
        error: 'Mercado Pago Token Exchange Failed', 
        details: errorData 
      }, { status: mpTokenResponse.status });
    }

    const credentials = await mpTokenResponse.json();
    const { access_token, public_key, refresh_token, user_id: mp_user_id } = credentials;

    // 4. Update User Document in Firestore
    // We use the 'state' variable which we passed as the Firebase UID during the auth link generation
    const userRef = doc(db, 'users', state);
    
    await updateDoc(userRef, {
      mp_credentials: {
        access_token,
        public_key,
        refresh_token,
        mp_user_id,
        linkedAt: new Date().toISOString(),
      },
      // Also update the role if they were pending
      mercadopago_linked: true
    });

    console.log(`Mercado Pago successfully linked for user: ${state}`);

    // 5. Success Redirect
    const redirectUrl = new URL('/panel-cluber', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('success', 'mp_linked');
    
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('CRITICAL: Mercado Pago Callback Error:', error);
    
    // Attempt to redirect to error page or back to panel with error
    const errorUrl = new URL('/panel-cluber', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    errorUrl.searchParams.set('error', 'mp_link_failed');
    errorUrl.searchParams.set('message', error.message);
    
    return NextResponse.json({ 
        error: 'Internal Server Error during MP Callback', 
        message: error.message 
    }, { status: 500 });
  }
}

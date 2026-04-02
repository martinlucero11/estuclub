export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Mercado Pago OAuth Callback
 * Handles token exchange and stores credentials in Firestore securely
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // Unique UUID from our mp_oauth_states collection

  // 1. Validation
  if (!code || !state) {
    return NextResponse.json({ 
      error: 'Missing required parameters (code or state)',
      received: { code: !!code, state: !!state }
    }, { status: 400 });
  }

  try {
    // 2. Validate State (Nonce) against Firestore using Admin SDK
    const stateRef = adminDb.collection('mp_oauth_states').doc(state);
    const stateDoc = await stateRef.get();

    if (!stateDoc.exists) {
      console.warn(`Attempted invalid OAuth callback with state: ${state}`);
      return NextResponse.json({ error: 'Estado OAuth inválido o expirado' }, { status: 403 });
    }

    const stateData = stateDoc.data();
    if (stateData?.used) {
      console.warn(`Attempted reuse of OAuth state: ${state}`);
      return NextResponse.json({ error: 'Este código de vinculación ya fue utilizado' }, { status: 403 });
    }

    const userId = stateData?.userId;
    if (!userId) {
        return NextResponse.json({ error: 'Usuario no identificado en el estado' }, { status: 403 });
    }

    // 3. Mark state as used immediately to prevent race conditions
    await stateRef.update({ 
        used: true, 
        usedAt: new Date() 
    });

    // 4. Exchange Code for Access Token
    const mpTokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_secret: process.env.MP_CLIENT_SECRET,
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

    // 5. Update User Document in Firestore using Admin SDK
    await adminDb.collection('users').doc(userId).update({
      mp_credentials: {
        access_token,
        public_key,
        refresh_token,
        mp_user_id,
        linkedAt: new Date().toISOString(),
      },
      // Metadatos de estado para el panel
      mercadopago_linked: true
    });



    // 6. Success Redirect
    // Determinamos el panel según el flujo (podríamos guardar el origen en el state si fuera necesario)
    const redirectUrl = new URL('/panel-cluber', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('success', 'mp_linked');
    
    return NextResponse.redirect(redirectUrl);

  } catch (error: any) {
    console.error('CRITICAL: Mercado Pago Callback Error:', error);
    
    return NextResponse.json({ 
        error: 'Internal Server Error during MP Callback', 
        message: error.message 
    }, { status: 500 });
  }
}

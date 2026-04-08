export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Mercado Pago OAuth Callback Handler
 * 
 * 1. Validates the state (nonce) against Firestore.
 * 2. Exchanges the authorization code for access/refresh tokens.
 * 3. Stores credentials in both Users and Roles_Supplier collections.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // 1. Initial Validation
  if (!code || !state) {
    console.error('MP OAuth Callback: Missing code or state');
    return NextResponse.json({ 
      error: 'Invalid request: missing authorization code or state' 
    }, { status: 400 });
  }

  try {
    // 2. State Validation (Anti-CSRF)
    const stateRef = adminDb.collection('mp_oauth_states').doc(state);
    const stateDoc = await stateRef.get();

    if (!stateDoc.exists) {
        return NextResponse.json({ error: 'OAuth state not found or expired' }, { status: 403 });
    }

    const stateData = stateDoc.data();
    if (stateData?.used) {
        return NextResponse.json({ error: 'OAuth code already used' }, { status: 403 });
    }

    const userId = stateData?.userId;
    if (!userId) {
        return NextResponse.json({ error: 'User context not found in state' }, { status: 403 });
    }

    // 3. Prevent state reuse
    await stateRef.update({ 
        used: true, 
        usedAt: new Date() 
    });

    // 4. Token Exchange Request
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` // Recommended by MP
      },
      body: JSON.stringify({
        client_secret: process.env.MP_CLIENT_SECRET,
        client_id: process.env.MP_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mp/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorDetails = await tokenResponse.json();
      console.error('MP Token Exchange Failed:', errorDetails);
      return NextResponse.json({ 
        error: 'Failed to exchange token with Mercado Pago', 
        details: errorDetails 
      }, { status: tokenResponse.status });
    }

    const credentials = await tokenResponse.json();
    const { access_token, public_key, refresh_token, user_id: mp_user_id } = credentials;

    const credentialData = {
        access_token,
        public_key,
        refresh_token,
        mp_user_id,
        linkedAt: new Date().toISOString(),
    };

    // 5. Atomic Update: User + Supplier Profile
    const batch = adminDb.batch();

    // Update User Metadata
    const userRef = adminDb.collection('users').doc(userId);
    batch.update(userRef, {
        mp_credentials: credentialData,
        mercadopago_linked: true
    });

    // Update Supplier Credentials (Primary storage for logistics)
    const supplierRef = adminDb.collection('roles_supplier').doc(userId);
    batch.set(supplierRef, {
        mp_credentials: credentialData,
        mp_linked: true,
        updatedAt: new Date()
    }, { merge: true });

    await batch.commit();

    // 6. Final Redirect to Dashboard
    const redirectUrl = new URL('/panel-cluber/configuracion', process.env.NEXT_PUBLIC_BASE_URL || 'https://estuclub.com.ar');
    redirectUrl.searchParams.set('success', 'mp_linked');
    
    return NextResponse.redirect(redirectUrl);

  } catch (err: any) {
    console.error('CATASTROPHIC: MP OAuth Error:', err);
    return NextResponse.json({ 
        error: 'Internal logistics failure connecting to Mercado Pago',
        message: err.message
    }, { status: 500 });
  }
}


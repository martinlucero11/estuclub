export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Standardized Redirect URI Logic
 */
const getRedirectUri = () => {
  return process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000/api/mp/callback'
    : 'https://estuclub.com.ar/api/mp/callback';
};

/**
 * Mercado Pago OAuth Callback Handler
 * Optimized for diagnostic visibility and environmental parity.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  console.log(`[MP-DEBUG] Callback received. Code: ${code ? 'Yes' : 'No'}, State: ${state}`);

  // 0. Database Availability Check
  if (!adminDb) {
    console.error('[MP-ERROR] Firebase Admin SDK failed to initialize. adminDb is null.');
    return NextResponse.json({ 
      error: 'Infrastructure Error', 
      message: 'Database connection not available. Check server logs for FIREBASE-ADMIN errors.' 
    }, { status: 500 });
  }

  // 1. Initial Validation
  if (!code || !state) {
    console.error('[MP-ERROR] Missing code or state in callback params');
    return NextResponse.json({ error: 'Invalid OAuth response' }, { status: 400 });
  }

  try {
    // 2. State Validation
    const stateRef = adminDb.collection('mp_oauth_states').doc(state);
    const stateDoc = await stateRef.get();

    if (!stateDoc.exists) {
        console.error(`[MP-ERROR] State ${state} not found in Firestore`);
        return NextResponse.json({ error: 'OAuth state not found' }, { status: 403 });
    }

    const stateData = stateDoc.data();
    if (stateData?.used) {
        console.error(`[MP-ERROR] State ${state} already used at ${stateData.usedAt}`);
        return NextResponse.json({ error: 'OAuth code already used' }, { status: 403 });
    }

    const userId = stateData?.userId;
    const redirectUri = getRedirectUri();

    // 3. Mark state as used BEFORE calling MP to prevent race conditions
    await stateRef.update({ used: true, usedAt: new Date() });

    console.log(`[MP-DEBUG] Exchanging code for user ${userId}. Using Redirect URI: ${redirectUri}`);

    // 4. Token Exchange Request
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_secret: process.env.MP_CLIENT_SECRET,
        client_id: process.env.MP_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json();
      
      // CRITICAL LOG: This will show in the Firebase/Terminal console
      console.error('--- MERCADO PAGO EXCHANGE REJECTED ---');
      console.error('Status:', tokenResponse.status);
      console.dir(errorBody, { depth: null });
      console.error('--------------------------------------');

      return NextResponse.json({ 
        error: 'Mercado Pago rejected the token exchange', 
        details: errorBody,
        status: tokenResponse.status
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

    // 5. Atomic Update
    const batch = adminDb.batch();
    const userRef = adminDb.collection('users').doc(userId);
    const supplierRef = adminDb.collection('roles_supplier').doc(userId);

    batch.update(userRef, {
        mp_credentials: credentialData,
        mercadopago_linked: true
    });

    batch.set(supplierRef, {
        mp_credentials: credentialData,
        mp_linked: true,
        updatedAt: new Date()
    }, { merge: true });

    await batch.commit();

    console.log(`[MP-SUCCESS] Account ${mp_user_id} linked successfully for user ${userId}`);

    const dashboardUrl = new URL('/panel-cluber/configuracion', redirectUri);
    dashboardUrl.searchParams.set('success', 'mp_linked');
    
    return NextResponse.redirect(dashboardUrl);

  } catch (err: any) {
    console.error('[MP-FATAL] Unhandled error in callback:', err);
    return NextResponse.json({ 
        error: 'Internal Callback Failure',
        message: err.message
    }, { status: 500 });
  }
}


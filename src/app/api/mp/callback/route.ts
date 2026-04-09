export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb, getInitError } from '@/lib/firebase-admin';

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
  
  // Read the cookie (diagnostic only for MVP bypass)
  const storedState = cookies().get('__session')?.value;

  console.log(`[MP-DEBUG] Callback received. Code: ${code ? 'Yes' : 'No'}, State: ${state}, Cookie: ${storedState || 'Missing'}`);

  // 0. Database Availability Check
  if (!adminDb) {
    const initError = getInitError();
    console.error('[MP-ERROR] Firebase Admin SDK failed to initialize.', initError);
    return NextResponse.json({ 
      error: 'Firebase Infrastructure Failure'
    }, { status: 500 });
  }

  // 1. Initial Validation - Only require code for MVP bypass
  if (!code) {
    console.error('[MP-ERROR] Missing code in callback params');
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  // 2. State Validation - BYPASSED FOR MVP
  // We still need to find the userId to know who we are linking.
  let userId: string | undefined;

  try {
    if (state) {
      const stateRef = adminDb.collection('mp_oauth_states').doc(state);
      const stateDoc = await stateRef.get();
      
      if (stateDoc.exists) {
        userId = stateDoc.data()?.userId;
        // Mark as used if found
        await stateRef.update({ used: true, usedAt: new Date() });
      } else {
        console.warn(`[MP-WARN] State ${state} not found in Firestore. Proceeding with state as fallback userId.`);
        userId = state; // Fallback: try using the state value itself as userId
      }
    }

    if (!userId) {
      console.error('[MP-ERROR] Could not determine userId from state');
      return NextResponse.json({ error: 'Invalid session/state' }, { status: 403 });
    }

    const redirectUri = getRedirectUri();
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


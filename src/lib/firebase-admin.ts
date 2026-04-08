import * as admin from 'firebase-admin';

/**
 * Global state to capture initialization errors for diagnostic transparency.
 */
let initializationError: any = null;

/**
 * Robust Firebase Admin Initialization
 * FIX: Strong PEM formatting to handle environment variables newlines/quotes.
 */
function initializeAdmin() {
  if (admin.apps.length > 0) return admin.app();

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountVar) {
    initializationError = { code: 'missing-env-var', message: 'FIREBASE_SERVICE_ACCOUNT is not defined' };
    console.warn('[FIREBASE-ADMIN] Missing FIREBASE_SERVICE_ACCOUNT');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountVar);
    
    // 1. Bulletproof PEM Formatter
    let rawPrivateKey = serviceAccount.private_key;

    if (rawPrivateKey) {
      // Remove accidental wrapping quotes (sometimes added by env managers)
      rawPrivateKey = rawPrivateKey.replace(/^["']|["']$/g, '');
      // Convert literal escaped \n into real newlines
      rawPrivateKey = rawPrivateKey.replace(/\\n/g, '\n');
    }

    // 2. Initialize using explicit mapping
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: rawPrivateKey,
      }),
    });

    console.log(`[FIREBASE-ADMIN] Initialized successfully for project: ${serviceAccount.project_id}`);
    initializationError = null; // Clear success
    return app;
  } catch (error: any) {
    initializationError = { 
        code: error.code || 'initialization-failed', 
        message: error.message,
        stack: error.stack
    };
    console.error('[FIREBASE-ADMIN] Critical Initialization Failure:', error);
    return null;
  }
}

// Initial call
const app = initializeAdmin();

// Exports
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminMessaging = admin.apps.length > 0 ? admin.messaging() : null;
export const getInitError = () => initializationError;

export { admin };

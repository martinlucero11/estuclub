import * as admin from 'firebase-admin';

/**
 * Global state to capture initialization errors for diagnostic transparency.
 */
let initializationError: any = null;

/**
 * Robust Firebase Admin Initialization
 */
function initializeAdmin() {
  // 1. Prevent duplicate initialization (common in Next.js HMR)
  if (admin.apps.length > 0) return admin.app();

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountVar) {
    initializationError = { code: 'missing-env-var', message: 'FIREBASE_SERVICE_ACCOUNT is not defined' };
    console.warn('[FIREBASE-ADMIN] Missing FIREBASE_SERVICE_ACCOUNT');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountVar);
    
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key?.replace(/\\n/g, '\n'),
      }),
    });

    console.log(`[FIREBASE-ADMIN] Initialized successfully for project: ${serviceAccount.project_id}`);
    return app;
  } catch (error: any) {
    // CAPTURE THE RAW ERROR FOR THE FRONTEND
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

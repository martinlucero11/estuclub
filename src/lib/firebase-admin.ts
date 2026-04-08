import * as admin from 'firebase-admin';

/**
 * Robust Firebase Admin Initialization
 * Ensures the SDK is initialized correctly with environmental awareness.
 */
function initializeAdmin() {
  if (admin.apps.length > 0) return admin.app();

  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountVar) {
    console.warn('[FIREBASE-ADMIN] Missing FIREBASE_SERVICE_ACCOUNT environment variable');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountVar);
    
    // Validate project_id to catch malformed JSON early
    if (!serviceAccount.project_id) {
      console.error('[FIREBASE-ADMIN] Malformed Service Account: Missing project_id');
      return null;
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        ...serviceAccount,
        privateKey: serviceAccount.privateKey?.replace(/\\n/g, '\n'),
      }),
    });

    console.log(`[FIREBASE-ADMIN] Initialized successfully for project: ${serviceAccount.project_id}`);
    return app;
  } catch (error: any) {
    console.error('[FIREBASE-ADMIN] Initialization failed:', error.message);
    return null;
  }
}

// Initial call
const app = initializeAdmin();

// Exports with high-availability patterns
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminMessaging = admin.apps.length > 0 ? admin.messaging() : null;

// Re-export common types if needed
export { admin };

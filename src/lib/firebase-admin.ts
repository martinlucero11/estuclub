import admin from "firebase-admin";

/**
 * Global state to capture initialization errors for diagnostic transparency.
 */
let initializationError: any = null;

function getServiceAccount() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    const error = new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64 env var");
    initializationError = { code: 'missing-env-var', message: error.message };
    throw error;
  }

  try {
    const json = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch (error: any) {
    initializationError = { code: 'parse-failed', message: error.message };
    throw error;
  }
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(getServiceAccount()),
    });
    console.log("Firebase Admin inicializado correctamente vía Base64");
    initializationError = null;
  } catch (error: any) {
    console.error("Error inicializando Firebase Admin:", error);
    initializationError = {
      code: error.code || 'initialization-failed',
      message: error.message,
      stack: error.stack
    };
  }
}

// Exports for internal use
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
export const adminMessaging = admin.apps.length > 0 ? admin.messaging() : null;
export const getInitError = () => initializationError;

export { admin };


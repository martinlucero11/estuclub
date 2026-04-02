import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

if (!admin.apps.length && projectId && clientEmail && privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } catch (e) {
    console.warn('Firebase Admin init skipped');
  }
}

// Proxy de seguridad: Si no hay Admin, devuelve un objeto falso que no rompa los .collection().doc()
export const adminDb = admin.apps.length 
  ? admin.firestore() 
  : new Proxy({}, { get: () => () => ({ doc: () => ({ get: () => Promise.resolve({ exists: false, data: () => ({}) }), set: () => Promise.resolve() }) }) }) as any;

export const adminAuth = admin.apps.length ? admin.auth() : null as any;
export const adminStorage = admin.apps.length ? admin.storage() : null as any;

export default admin;
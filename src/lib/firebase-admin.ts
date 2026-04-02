import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    if (serviceAccount.project_id) {
      admin.initializeApp({
        credential: admin.credential.cert({
          ...serviceAccount,
          privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
  } catch (error) {
    console.warn('Firebase Admin Init Skipped (Normal during build)');
  }
}
export const adminDb = admin.apps.length ? admin.firestore() : null;
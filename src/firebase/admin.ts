import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK Setup (Server Side)
 * Used for secure role updates and backend Firestore triggers
 * Requires GOOGLE_APPLICATION_CREDENTIALS path or FIREBASE_SERVICE_ACCOUNT_JSON in environment
 */

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON 
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
            : undefined;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } else {
            // Falls back to Google Cloud default application credentials or ADC
            admin.initializeApp();
        }
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();


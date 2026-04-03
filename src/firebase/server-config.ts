import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

// We check if the app is already initialized to prevent re-initialization errors.
if (!admin.apps.length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
      : null;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert({
          ...serviceAccount,
          privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: firebaseConfig.storageBucket,
      });
    } else {
      // Fallback for build time or environments where service account is missing
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });
    }
  } catch (e) {
    console.warn('Firebase Admin Init Caution (Possible during build):', e);
    // Minimal initialization to avoid crashes
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  }
}

// Get the Firestore instance from the initialized admin app.
const firestore = admin.firestore();

export { admin, firestore };

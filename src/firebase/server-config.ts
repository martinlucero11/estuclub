import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';

// We check if the app is already initialized to prevent re-initialization errors.
if (!admin.apps.length) {
  try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
      );
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert({
          ...serviceAccount,
          privateKey: serviceAccount.privateKey ? serviceAccount.privateKey.replace(/\\n/g, '\n') : undefined,
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


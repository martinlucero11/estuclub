import * as admin from 'firebase-admin';
import { firebaseConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

// We check if the app is already initialized to prevent re-initialization errors.
if (!admin.apps.length) {
  const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
  let config: any = {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  };

  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      config.credential = admin.credential.cert(serviceAccount);
      console.log('Firebase Admin initialized with local service account.');
    } catch (e) {
      console.error('Error loading service account JSON:', e);
    }
  }

  admin.initializeApp(config);
}

// Get the Firestore instance from the initialized admin app.
// This instance has privileged access to the database.
const firestore = admin.firestore();

// We can also export the admin object itself for other uses (e.g., Auth).
export { admin, firestore };

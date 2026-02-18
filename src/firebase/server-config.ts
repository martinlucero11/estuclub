
import * as admin from 'firebase-admin';

// In a deployed Google Cloud environment (like App Hosting or Cloud Functions),
// the Firebase Admin SDK is automatically configured with the project's
// service account credentials. We don't need to pass them manually.

// We check if the app is already initialized to prevent re-initialization errors.
if (!admin.apps.length) {
  admin.initializeApp();
}

// Get the Firestore instance from the initialized admin app.
// This instance has privileged access to the database.
const firestore = admin.firestore();

// We can also export the admin object itself for other uses (e.g., Auth).
export { admin, firestore };

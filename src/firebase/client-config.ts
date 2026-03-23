
// src/firebase/client-config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, persistentLocalCache } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

// Initialize Firebase for the CLIENT
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Enable persistent local cache for offline support
let firestore;
try {
  firestore = initializeFirestore(app, { 
    localCache: persistentLocalCache({}) 
  });
} catch {
  firestore = getFirestore(app);
}
const auth = getAuth(app);

export { app, firestore, auth };

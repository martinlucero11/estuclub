
// src/firebase/client-config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore, memoryLocalCache } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

// Initialize Firebase for the CLIENT
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use memory cache to prevent IndexedDB corruption (ca9 assertion error)
let firestore;
try {
  firestore = initializeFirestore(app, { localCache: memoryLocalCache() });
} catch {
  firestore = getFirestore(app);
}
const auth = getAuth(app);

export { app, firestore, auth };


// src/firebase/client-config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';

// Initialize Firebase for the CLIENT
// We check if the app is already initialized to prevent re-initialization on hot reloads.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const firestore = getFirestore(app);
const auth = getAuth(app);

// Export the initialized services
export { app, firestore, auth };

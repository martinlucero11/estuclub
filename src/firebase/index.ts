'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Initializes and returns Firebase services. It ensures that Firebase is initialized
 * only once, which is crucial in a Next.js environment with server-side rendering
 * and Fast Refresh.
 *
 * @returns An object containing the initialized Firebase services.
 */
export function initializeFirebase() {
  // Check if any Firebase app has already been initialized.
  // If not, initialize a new one. If so, use the existing one.
  const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  return {
    firebaseApp,
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
    auth: getAuth(firebaseApp),
  };
}

// Re-export all the necessary providers, hooks, and utilities.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-doc-once';
export * from './errors';
export * from './error-emitter';
export * from './auth/use-admin';
export * from './auth/use-supplier';
export * from './auth/use-supplier-profile';
export * from '@/hooks/use-user-rank';

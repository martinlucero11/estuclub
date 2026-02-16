'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { useMemo, type DependencyList } from 'react';

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

// Helper hook for memoizing Firebase queries
type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  // This property is a flag to indicate that the object has been memoized,
  // to prevent re-renders in hooks like useCollection and useDoc.
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

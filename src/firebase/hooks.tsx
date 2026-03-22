'use client';

import { useContext, useMemo } from 'react';
import { Auth, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseApp } from 'firebase/app';
import { FirebaseContext, FirebaseContextState, SupplierData } from '@/firebase/provider';
import type { UserProfile } from '@/types/data';

// --- TYPE DEFINITIONS FOR HOOKS ---

// Describes the full object returned by useFirebase, including services
export interface FirebaseServicesAndUser extends Omit<FirebaseContextState, 'areServicesAvailable' | 'firebaseApp' | 'firestore' | 'auth' | 'storage'> {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  userData: UserProfile | null;
  supplierData: SupplierData | null;
  userLocation: { lat: number; lng: number } | null;
}

// Describes the simplified object for general use, returned by useUser
export interface UserHookResult extends Omit<FirebaseServicesAndUser, 'firebaseApp' | 'firestore' | 'auth' | 'storage'> {}

// --- HOOK IMPLEMENTATIONS ---

/**
 * The primary hook to access the complete Firebase context, including service instances.
 * Throws an error if used outside of FirebaseProvider or if services are unavailable.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (
    !context.areServicesAvailable ||
    !context.firebaseApp ||
    !context.firestore ||
    !context.auth ||
    !context.storage
  ) {
    throw new Error('Firebase core services not available. Check FirebaseProvider setup.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    roles: context.roles,
    userData: context.userData,
    supplierData: context.supplierData,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    userLocation: context.userLocation,
  };
};

/**
 * A convenience hook to get only the user state (user object, roles, loading status).
 */
export const useUser = (): UserHookResult => {
  const { user, roles, userData, supplierData, isUserLoading, userError, userLocation } = useFirebase();
  return useMemo(() => ({ 
    user, 
    roles, 
    userData, 
    supplierData, 
    isUserLoading, 
    userError,
    userLocation
  }), [user, roles, userData, supplierData, isUserLoading, userError, userLocation]);
};

/**
 * A convenience hook to directly access the Firebase Auth instance.
 */
export const useAuthService = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/**
 * A convenience hook to directly access the Firestore instance.
 */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/**
 * A convenience hook to directly access the Firebase Storage instance.
 */
export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage;
};

/**
 * A convenience hook to directly access the Firebase App instance.
 */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

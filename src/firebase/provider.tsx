
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, getApps, getApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getAuth, IdTokenResult } from 'firebase/auth';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/firebase/error-listener';
import { firebaseConfig } from '@/firebase/config';

// --- TYPE DEFINITIONS ---

interface UserAuthState {
  user: User | null;
  roles: string[]; 
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: User | null;
  roles: string[];
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: User | null;
  roles: string[];
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult {
  user: User | null;
  roles: string[];
  isUserLoading: boolean;
  userError: Error | null;
}

// --- UTILITY FUNCTION --- 

const getRolesFromClaims = (claims: IdTokenResult["claims"]): string[] => {
  // --- CRITICAL DEBUGGING ---
  console.log("Firebase Custom Claims received from token:", JSON.stringify(claims, null, 2));
  // --------------------------

  const rawRoles = claims.roles || claims.role; // Look for `roles` (plural) first, then `role` (singular)

  if (Array.isArray(rawRoles)) {
    return rawRoles;
  }
  if (typeof rawRoles === 'string') {
    return rawRoles.split(/[,\s]+/).filter(Boolean); // Split by comma or space, and remove empty strings
  }
  return []; // Default to no roles
}

// --- REACT CONTEXT ---

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// --- MAIN PROVIDER COMPONENT ---

export const FirebaseProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const services = useMemo(() => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    return {
      firebaseApp: app,
      firestore: getFirestore(app),
      auth: getAuth(app),
      storage: getStorage(app),
    };
  }, []);

  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    roles: [], 
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      services.auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const tokenResult = await firebaseUser.getIdTokenResult(true);
            const userRoles = getRolesFromClaims(tokenResult.claims);
            console.log("ROLES PROCESADOS", userRoles);
            setUserAuthState({ user: firebaseUser, roles: userRoles, isUserLoading: false, userError: null });
          } catch (error) {
            console.error("FirebaseProvider: Error getting user roles:", error);
            setUserAuthState({ user: firebaseUser, roles: [], isUserLoading: false, userError: error as Error });
          }
        } else {
          setUserAuthState({ user: null, roles: [], isUserLoading: false, userError: null });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, roles: [], isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [services.auth]);

  const contextValue = useMemo((): FirebaseContextState => ({
    areServicesAvailable: true,
    ...services,
    ...userAuthState,
  }), [services, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};


// --- HOOKS (unchanged) ---

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    roles: context.roles, 
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useStorage = (): FirebaseStorage => {
    const { storage } = useFirebase();
    return storage;
}

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

export const useUser = (): UserHookResult => {
  const { user, roles, isUserLoading, userError } = useFirebase();
  return { user, roles, isUserLoading, userError };
};

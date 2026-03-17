
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, getApps, getApp, initializeApp } from 'firebase/app';
import { Firestore, getFirestore, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/firebase/error-listener';
import { firebaseConfig } from '@/firebase/config';

// --- TYPE DEFINITIONS ---

export type SupplierData = Record<string, any>;

interface UserAuthState {
  user: User | null;
  roles: string[];
  supplierData: SupplierData | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}

export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
}

export interface UserHookResult extends UserAuthState {}

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
    supplierData: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(services.auth, async (firebaseUser) => {
      setUserAuthState(prevState => ({ ...prevState, isUserLoading: true }));

      if (firebaseUser) {
        try {
            await firebaseUser.getIdToken(true);
            
            const userRoles: string[] = ['user'];
            let supplierData: SupplierData | null = null;

            // --- Admin Role Check ---
            try {
                const adminRoleRef = doc(services.firestore, 'roles_admin', firebaseUser.uid);
                const adminDoc = await getDoc(adminRoleRef);
                if (adminDoc.exists()) {
                    userRoles.push('admin');
                }
            } catch (error) {
                 console.warn("Could not check admin role due to permissions or network error:", error);
            }

            // --- Supplier Role Check ---
            try {
                const supplierRoleRef = doc(services.firestore, 'roles_supplier', firebaseUser.uid);
                const supplierDoc = await getDoc(supplierRoleRef);
                if (supplierDoc.exists()) {
                    userRoles.push('supplier');
                    supplierData = supplierDoc.data() as SupplierData;
                }
            } catch (error) {
                console.warn("Could not check supplier role due to permissions or network error:", error);
            }

            setUserAuthState({
                user: firebaseUser,
                roles: Array.from(new Set(userRoles)),
                supplierData,
                isUserLoading: false,
                userError: null
            });

        } catch (error) {
            console.error("Critical error fetching user state:", error);
            setUserAuthState({
                user: firebaseUser,
                roles: ['user'], // Fallback to basic user role
                supplierData: null,
                isUserLoading: false,
                userError: error as Error
            });
        }
      } else {
        // User is signed out, clear all user-related state.
        setUserAuthState({ 
          user: null, 
          roles: [], 
          supplierData: null, 
          isUserLoading: false, 
          userError: null 
        });
      }
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [services.auth, services.firestore]);

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


// --- HOOKS ---

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
    supplierData: context.supplierData,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuthService = (): Auth => {
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
  const { user, roles, supplierData, isUserLoading, userError } = useFirebase();
  return { user, roles, supplierData, isUserLoading, userError };
};

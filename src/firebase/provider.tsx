'use client';

import React, { createContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, getApps, getApp, initializeApp } from 'firebase/app';
import { Firestore, initializeFirestore, getFirestore, memoryLocalCache, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { FirebaseStorage, getStorage } from 'firebase/storage';
import { firebaseConfig } from '@/firebase/config';
import type { UserProfile } from '@/types/data';

// --- TYPE DEFINITIONS ---

export type SupplierData = Record<string, any>;

interface AuthState {
  user: User | null;
  isAuthLoading: boolean;
  authError: Error | null;
}

interface ProfileState {
  roles: string[];
  userData: UserProfile | null;
  supplierData: SupplierData | null;
  isProfileLoading: boolean;
  profileError: Error | null;
}

// This interface defines the shape of the context value.
// It is exported so that the hooks in hooks.tsx can be typed correctly.
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: User | null;
  roles: string[];
  userData: UserProfile | null;
  supplierData: SupplierData | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// --- REACT CONTEXT ---

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// --- MAIN PROVIDER COMPONENT ---

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const services = useMemo(() => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Use memory cache to prevent IndexedDB corruption that causes ca9 assertion error
    // initializeFirestore throws if already initialized (hot reload), fallback to getFirestore
    let firestore: Firestore;
    try {
      firestore = initializeFirestore(app, { localCache: memoryLocalCache() });
    } catch {
      firestore = getFirestore(app);
    }
    
    return {
      firebaseApp: app,
      firestore,
      auth: getAuth(app),
      storage: getStorage(app),
    };
  }, []);

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthLoading: true,
    authError: null,
  });

  const [profileState, setProfileState] = useState<ProfileState>({
    roles: [],
    userData: null,
    supplierData: null,
    isProfileLoading: false,
    profileError: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(services.auth, (firebaseUser) => {
      setAuthState({ user: firebaseUser, isAuthLoading: false, authError: null });
    });
    return () => unsubscribe();
  }, [services.auth]);

  useEffect(() => {
    if (!authState.user) {
      setProfileState({ roles: [], userData: null, supplierData: null, isProfileLoading: false, profileError: null });
      return;
    }

    setProfileState(prev => ({ ...prev, isProfileLoading: true, profileError: null }));

    const fetchUserRoles = async () => {
      const userRoles: string[] = ['user'];
      let userData: UserProfile | null = null;
      let supplierData: SupplierData | null = null;

      try {
        const userDocRef = doc(services.firestore, 'users', authState.user!.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          userData = userDoc.data() as any;
        }

        const adminRoleRef = doc(services.firestore, 'roles_admin', authState.user!.uid);
        const adminDoc = await getDoc(adminRoleRef);
        if (adminDoc.exists()) {
          userRoles.push('admin');
        }

        const supplierRoleRef = doc(services.firestore, 'roles_supplier', authState.user!.uid);
        const supplierDoc = await getDoc(supplierRoleRef);
        if (supplierDoc.exists()) {
          userRoles.push('supplier');
          supplierData = supplierDoc.data() as SupplierData;
        }

        setProfileState({
          roles: Array.from(new Set(userRoles)),
          userData,
          supplierData,
          isProfileLoading: false,
          profileError: null,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setProfileState({
          roles: ['user'],
          userData: null,
          supplierData: null,
          isProfileLoading: false,
          profileError: error as Error,
        });
      }
    };

    fetchUserRoles();
  }, [authState.user, services.firestore]);

  const contextValue = useMemo(
    (): FirebaseContextState => ({
      areServicesAvailable: true,
      ...services,
      user: authState.user,
      roles: profileState.roles,
      userData: profileState.userData,
      supplierData: profileState.supplierData,
      isUserLoading: authState.isAuthLoading || profileState.isProfileLoading,
      userError: authState.authError || profileState.profileError,
    }),
    [
      services,
      authState.user,
      authState.isAuthLoading,
      authState.authError,
      profileState.roles,
      profileState.userData,
      profileState.supplierData,
      profileState.isProfileLoading,
      profileState.profileError,
    ]
  );

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

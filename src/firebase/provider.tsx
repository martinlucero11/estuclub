'use client';

import React, { createContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp, getApps, getApp, initializeApp } from 'firebase/app';
import { Firestore, initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc } from 'firebase/firestore';
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
  userLocation: { lat: number; lng: number } | null;
  requestLocation: () => void;
}

// --- REACT CONTEXT ---

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// --- MAIN PROVIDER COMPONENT ---

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const services = useMemo(() => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Enable persistent local cache for offline support
    // initializeFirestore throws if already initialized (hot reload), fallback to getFirestore
    let firestore: Firestore;
    try {
      firestore = initializeFirestore(app, { 
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
          cacheSizeBytes: 100 * 1024 * 1024 // Increase cache to 100MB for better offline experience
        }) 
      });
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

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = React.useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation not allowed or failed', err),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    }
  }, []);

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

    const fetchUserRoles = async () => {
      const uid = authState.user!.uid;
      
      try {
        setProfileState(prev => ({ ...prev, isProfileLoading: true, profileError: null }));

        // Fetch user data, admin role, and supplier role in parallel
        const [userDoc, adminDoc, supplierDoc] = await Promise.all([
          getDoc(doc(services.firestore, 'users', uid)),
          getDoc(doc(services.firestore, 'roles_admin', uid)),
          getDoc(doc(services.firestore, 'roles_supplier', uid))
        ]);

        const userRoles: string[] = ['user'];
        let userData: UserProfile | null = null;
        let supplierData: SupplierData | null = null;

        if (userDoc.exists()) {
          userData = userDoc.data() as any;
        }

        if (adminDoc.exists()) {
          userRoles.push('admin');
        }

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
      userLocation,
      requestLocation,
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
      userLocation,
      requestLocation,
    ]
  );

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

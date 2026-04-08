'use client';

import React, { createContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { getFirebaseServices } from '@/firebase/services';
import type { UserProfile } from '@/types/data';

export type SupplierData = Record<string, any>;

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

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const services = useMemo(() => getFirebaseServices(), []);

  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [supplierData, setSupplierData] = useState<SupplierData | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Guard against double-fetch during StrictMode
  const profileFetchId = useRef(0);

  const requestLocation = React.useCallback(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {}, // Geolocation not allowed or failed
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 600000 }
      );
    }
  }, []);

  useEffect(() => {
    let userUnsubscribe: (() => void) | null = null;
    let supplierUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(services.auth, async (firebaseUser) => {
      // Clean up previous snapshots if any
      if (userUnsubscribe) userUnsubscribe();
      if (supplierUnsubscribe) supplierUnsubscribe();

      if (!firebaseUser) {
        setUser(null);
        setRoles(['user']);
        setUserData(null);
        setSupplierData(null);
        setIsUserLoading(false);
        setUserError(null);
        return;
      }

      setUser(firebaseUser);
      setIsUserLoading(true);

      const uid = firebaseUser.uid;

      // 1. REAL-TIME SNAPSHOT: Users Collection
      userUnsubscribe = onSnapshot(doc(services.firestore, 'users', uid), (snapshot) => {
        if (snapshot.exists()) {
          setUserData(snapshot.data() as UserProfile);
        }
      });

      // 2. REAL-TIME SNAPSHOT: Roles Supplier
      supplierUnsubscribe = onSnapshot(doc(services.firestore, 'roles_supplier', uid), (snapshot) => {
        if (snapshot.exists()) {
          setSupplierData({ id: uid, ...snapshot.data() } as SupplierData);
        }
      });

      try {
        // One-time fetch for roles and profile to determine access
        const [adminResult, riderResult, profileResult, tokenResult] = await Promise.allSettled([
          getDoc(doc(services.firestore, 'roles_admin', uid)),
          getDoc(doc(services.firestore, 'roles_rider', uid)),
          getDoc(doc(services.firestore, 'users', uid)),
          firebaseUser.getIdTokenResult(),
        ]);

        const resolvedRoles: string[] = ['user'];
        const adminDoc = adminResult.status === 'fulfilled' ? adminResult.value : null;
        const riderDoc = riderResult.status === 'fulfilled' ? riderResult.value : null;
        const profileDoc = profileResult.status === 'fulfilled' ? profileResult.value : null;
        const token = tokenResult.status === 'fulfilled' ? tokenResult.value : null;

        // 1. Check dedicated role collections and claims
        if (adminDoc?.exists() || token?.claims?.admin) resolvedRoles.push('admin');
        if (riderDoc?.exists() || token?.claims?.rider) resolvedRoles.push('rider');
        
        // 2. Check primary profile role field (most common case for manual admin setup)
        if (profileDoc?.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            if (profileData.role === 'admin') resolvedRoles.push('admin');
            if (profileData.role === 'rider') resolvedRoles.push('rider');
            if (profileData.role === 'supplier') resolvedRoles.push('supplier');
        }

        // 3. Check supplier role
        const supplierDocRef = doc(services.firestore, 'roles_supplier', uid);
        const supplierRes = await getDoc(supplierDocRef);
        if (supplierRes.exists()) resolvedRoles.push('supplier');

        setRoles(Array.from(new Set(resolvedRoles)));
        setUserError(null);
      } catch (error) {
        console.error('Error loading roles:', error);
        setUserError(error as Error);
      } finally {
        setIsUserLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
      if (supplierUnsubscribe) supplierUnsubscribe();
    };
  }, [services.auth, services.firestore]);

  const contextValue = useMemo(
    (): FirebaseContextState => ({
      areServicesAvailable: true,
      ...services,
      user,
      roles,
      userData,
      supplierData,
      isUserLoading,
      userError,
      userLocation,
      requestLocation,
    }),
    [services, user, roles, userData, supplierData, isUserLoading, userError, userLocation, requestLocation]
  );

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};


'use client';

import React, { createContext, ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
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
    const unsubscribe = onAuthStateChanged(services.auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRoles([]);
        setUserData(null);
        setSupplierData(null);
        setIsUserLoading(false);
        setUserError(null);
        return;
      }

      setUser(firebaseUser);
      // Keep isUserLoading TRUE until profile fetch completes
      setIsUserLoading(true);

      const fetchId = ++profileFetchId.current;
      const uid = firebaseUser.uid;

      try {
        // Promise.allSettled: if any doc doesn't exist or rules block it, we don't crash
        const [userResult, adminResult, supplierResult, riderResult, tokenResult] = await Promise.allSettled([
          getDoc(doc(services.firestore, 'users', uid)),
          getDoc(doc(services.firestore, 'roles_admin', uid)),
          getDoc(doc(services.firestore, 'roles_supplier', uid)),
          getDoc(doc(services.firestore, 'roles_rider', uid)),
          firebaseUser.getIdTokenResult(),
        ]);

        // Abort if a newer fetch superseded us
        if (fetchId !== profileFetchId.current) return;

        const resolvedRoles: string[] = ['user'];

        // Admin: Firestore doc OR Custom Claim
        const adminDoc = adminResult.status === 'fulfilled' ? adminResult.value : null;
        const token = tokenResult.status === 'fulfilled' ? tokenResult.value : null;
        if (adminDoc?.exists() || token?.claims?.admin) {
          resolvedRoles.push('admin');
        }

        // Supplier: Firestore doc
        const supplierDoc = supplierResult.status === 'fulfilled' ? supplierResult.value : null;
        if (supplierDoc?.exists()) {
          resolvedRoles.push('supplier');
        }

        // Rider: Firestore doc OR Custom Claim
        const riderDoc = riderResult.status === 'fulfilled' ? riderResult.value : null;
        if (riderDoc?.exists() || token?.claims?.rider) {
          resolvedRoles.push('rider');
        }

        const userDoc = userResult.status === 'fulfilled' ? userResult.value : null;

        setRoles(Array.from(new Set(resolvedRoles)));
        setUserData(userDoc?.exists() ? (userDoc.data() as any) : null);
        setSupplierData(supplierDoc?.exists() ? ({ id: uid, ...supplierDoc.data() } as any) : null);
        setUserError(null);
      } catch (error) {
        if (fetchId !== profileFetchId.current) return;
        console.error('Error loading profile:', error);
        setUserError(error as Error);
      } finally {
        if (fetchId === profileFetchId.current) {
          setIsUserLoading(false);
        }
      }
    });

    return () => unsubscribe();
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

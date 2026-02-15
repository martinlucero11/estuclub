'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

let _firebaseApp: FirebaseApp;

function getFirebaseApp() {
    if (_firebaseApp) {
        return _firebaseApp;
    }
    if (getApps().length > 0) {
        _firebaseApp = getApp();
        return _firebaseApp;
    }
    // Se inicializa siempre con la configuración explícita para evitar discrepancias.
    _firebaseApp = initializeApp(firebaseConfig); 
    return _firebaseApp;
}

export function initializeFirebase() {
  const firebaseApp = getFirebaseApp();
  return {
    firebaseApp,
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
    auth: getAuth(firebaseApp),
  };
}

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

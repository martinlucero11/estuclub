
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

let _firebaseApp: FirebaseApp;

function getFirebaseApp() {
    if (_firebaseApp) {
        return _firebaseApp;
    }
    if (getApps().length > 0) {
        _firebaseApp = getApp();
        return _firebaseApp;
    }
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

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

let cachedServices: {
  firebaseApp: any;
  firestore: any;
  auth: any;
  storage: any;
} | null = null;

/**
 * Ensures Firebase services are initialized exactly once as a singleton.
 * This is crucial to avoid "Unexpected state (ID: ca9)" errors in Firestore
 * caused by multiple attempts to initialize persistent cache.
 */
export const getFirebaseServices = () => {
  if (typeof window === 'undefined') {
    // SSR Initialization (no persistence needed)
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    return {
      firebaseApp: app,
      firestore: getFirestore(app),
      auth: getAuth(app),
      storage: getStorage(app),
    };
  }

  // Client-side Singleton
  if (cachedServices) return cachedServices;

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  let firestore;
  try {
    // Attempt to initialize with SINGLE tab persistence for maximum stability
    // Multi-tab manager is known to cause ID: ca9 assertion failures in v11.x
    firestore = initializeFirestore(app, { 
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({})
      }),
      // Automatically fallback to long-polling if WebChannel/gRPC fails (common in mobile)
      experimentalAutoDetectLongPolling: true,
    });
  } catch (err) {
    firestore = getFirestore(app);
  }

  const auth = getAuth(app);
  const storage = getStorage(app);

  cachedServices = {
    firebaseApp: app,
    firestore,
    auth,
    storage,
  };

  return cachedServices;
};


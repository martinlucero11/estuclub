import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentSingleTabManager 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: "studio-7814845508-d173f",
  storageBucket: "studio-7814845508-d173f.firebasestorage.app",
  messagingSenderId: "742876183164",
  appId: "1:742876183164:web:2313c30be9f229479ea7f9"
};

// Firebase configuration initialized

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Step 1: COST OPTIMIZATION - Enable Persistent Cache
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager({})
  })
});



const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };


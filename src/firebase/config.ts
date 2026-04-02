import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCcdZGahEhyF6-LCfpuBlFHVt6cFWqDLLQ",
  authDomain: "studio-7814845508-d173f.firebaseapp.com",
  projectId: "studio-7814845508-d173f",
  storageBucket: "studio-7814845508-d173f.firebasestorage.app",
  messagingSenderId: "742876183164",
  appId: "1:742876183164:web:2313c30be9f229479ea7f9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };

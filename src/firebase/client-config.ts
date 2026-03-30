// src/firebase/client-config.ts
import { getFirebaseServices } from './services';

/**
 * Re-exports the unified singletons for the entire application.
 * This ensures that both the Provider and any standalone logic 
 * share the exact same Firestore and Auth instances.
 */
const services = getFirebaseServices();

export const app = services.firebaseApp;
export const firestore = services.firestore;
export const auth = services.auth;
export const storage = services.storage;

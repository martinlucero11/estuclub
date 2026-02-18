'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, firestore } from '@/firebase/client-config';

// Define the extended user type
export interface AppUser extends FirebaseUser {
  role?: 'admin' | 'user'; 
  supplierProfile?: {
    announcementsEnabled?: boolean;
    appointmentsEnabled?: boolean;
  };
}

// Define the context shape with the new user type
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        // User is logged in, now fetch the custom profile from Firestore
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        
        const unsubscribeFirestore = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            // Combine Firebase auth user with Firestore profile data
            const userData = doc.data();
            setUser({
              ...firebaseUser,
              role: userData.role,
              supplierProfile: userData.supplierProfile,
            });
          } else {
            // Firestore doc doesn't exist, just use the basic Firebase user
            setUser(firebaseUser as AppUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          // Handle error, maybe just use firebaseUser
          setUser(firebaseUser as AppUser);
          setLoading(false);
        });

        // Return a function to unsubscribe from Firestore listener when auth state changes
        return () => unsubscribeFirestore();
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup the auth subscription on component unmount
    return () => unsubscribeAuth();
  }, []);

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

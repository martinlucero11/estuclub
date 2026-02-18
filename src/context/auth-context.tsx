'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/firebase/client-config'; // Correctly import the auth service

// 1. Define the context shape
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// 2. Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Create the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only when not loading to prevent flicker or guarded routes being accessed prematurely */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 4. Create the custom hook for consuming the context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This error is helpful for developers to know they've misused the hook
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context; // This now correctly returns { user, loading }
}

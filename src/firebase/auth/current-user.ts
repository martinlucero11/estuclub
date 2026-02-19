import { cookies } from 'next/headers';
import { admin } from '@/firebase/server-config';
import type { UserRole } from '@/types/data';

export interface User {
  uid: string;
  email: string | null;
  roles: UserRole[];
}

async function getUserRoles(uid: string): Promise<UserRole[]> {
    const roles: UserRole[] = [];
    const adminDoc = await admin.firestore().collection('roles_admin').doc(uid).get();
    if (adminDoc.exists) {
        roles.push('admin');
    }
    const supplierDoc = await admin.firestore().collection('roles_supplier').doc(uid).get();
    if (supplierDoc.exists) {
        roles.push('supplier');
    }
    return roles;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return null; 
  }
  
  try {
    const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
    const roles = await getUserRoles(decodedToken.uid);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      roles: roles,
    };
  } catch (error) {
    console.error("Error verifying session cookie:", error);
    return null;
  }
}

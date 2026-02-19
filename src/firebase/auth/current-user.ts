import { cookies } from 'next/headers';

export interface User {
  uid: string;
  email: string | null;
  roles: string[];
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    return null; 
  }
  
  // In a real production app, you would use firebase-admin to verify the session cookie.
  // For this implementation, we assume the cookie's value is the UID.
  // This is NOT secure for production but allows the server-side dashboard layout to function.
  // You would replace this with: const decodedToken = await admin.auth().verifySessionCookie(sessionCookie.value);
  const uid = sessionCookie.value;

  if (!uid) {
    return null;
  }

  // This is a placeholder for demonstration. A real implementation would fetch roles
  // from Firestore using the Admin SDK based on the decoded UID.
  const mockRoles = ['admin', 'supplier'];
  
  return {
    uid: uid,
    email: null, // This would come from the decoded token
    roles: mockRoles,
  };
}

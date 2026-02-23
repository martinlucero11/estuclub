
'use client';

import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';

/**
 * Hook to determine if the current user is an administrator.
 *
 * This hook checks for the existence of a document in the `/roles_admin/{userId}`
 * collection in Firestore. The existence of this document grants admin privileges.
 * This approach aligns with the security rules (`isAdmin()` function).
 *
 * @returns An object containing:
 *  - `isAdmin`: A boolean that is `true` if the user is an admin, otherwise `false`.
 *  - `isLoading`: A boolean that is `true` while the user's auth state and admin status are being checked.
 */
export function useAdmin() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    // Create a memoized reference to the user's admin role document.
    const adminRoleRef = useMemo(
        () => (user ? doc(firestore, 'roles_admin', user.uid) : null),
        [user, firestore]
    );

    // Use the useDoc hook to check if the admin role document exists.
    // We only care about its existence, so we don't need the data itself.
    const { data: adminDoc, isLoading: isAdminDocLoading } = useDoc(adminRoleRef);
    
    // The user is an admin if the document exists.
    const isAdmin = !!adminDoc;

    // The overall loading state depends on both the user loading and the document loading.
    const isLoading = isUserLoading || (user ? isAdminDocLoading : false);

    return { 
        isAdmin, 
        isLoading
    };
}

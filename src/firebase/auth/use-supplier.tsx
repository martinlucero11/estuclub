'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * Hook to determine if the current user is a supplier.
 *
 * This hook checks for the existence of a document in the `/roles_supplier/{userId}`
 * collection in Firestore. The existence of this document grants supplier privileges.
 *
 * @returns An object containing:
 *  - `isSupplier`: A boolean that is `true` if the user is a supplier, otherwise `false`.
 *  - `isLoading`: A boolean that is `true` while the user's auth state and supplier status are being checked.
 */
export function useSupplier() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const supplierRoleRef = useMemoFirebase(
        () => (user ? doc(firestore, 'roles_supplier', user.uid) : null),
        [user, firestore]
    );

    const { data: supplierDoc, isLoading: isSupplierDocLoading } = useDoc(supplierRoleRef);
    
    const isSupplier = !!supplierDoc;

    // We are loading if the user is loading, or if we have a user but are still checking their role
    const isLoading = isUserLoading || (user ? isSupplierDocLoading : false);

    return { 
        isSupplier, 
        isLoading
    };
}

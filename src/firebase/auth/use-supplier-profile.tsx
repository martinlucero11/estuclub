
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

interface SupplierProfile {
    id: string;
    name: string;
    type: 'Institucion' | 'Club' | 'Iglesia' | 'Comercio' | 'Estado';
    slug: string;
    logoUrl?: string;
    description?: string;
    allowsBooking?: boolean;
}

/**
 * Hook to get the current user's supplier profile data.
 *
 * @returns An object containing:
 *  - `supplierProfile`: The supplier profile data object, or null if not a supplier.
 *  - `isLoading`: A boolean that is `true` while the user's auth state and supplier profile are being fetched.
 */
export function useSupplierProfile() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const supplierProfileRef = useMemoFirebase(
        () => (user ? doc(firestore, 'roles_supplier', user.uid) : null),
        [user, firestore]
    );

    // Use useDoc which subscribes to real-time updates
    const { data: supplierProfileData, isLoading: isProfileLoading } = useDoc<SupplierProfile>(supplierProfileRef);

    // Add the id to the profile data
    const supplierProfile = supplierProfileData ? { ...supplierProfileData, id: supplierProfileRef?.id } : null;

    // We are loading if the user is loading, or if we have a user but are still checking their role profile
    const isLoading = isUserLoading || (user ? isProfileLoading : false);

    return { 
        supplierProfile: supplierProfile as SupplierProfile | null,
        isLoading
    };
}

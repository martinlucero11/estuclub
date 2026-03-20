'use client';

import { useUser } from '@/firebase';
import type { SupplierProfile } from '@/types/data';
import { useMemo } from 'react';

/**
 * Hook to get the current user's supplier profile data.
 * It retrieves the data directly from the central `FirebaseProvider` context,
 * avoiding redundant database calls.
 *
 * @returns An object containing:
 *  - `supplierProfile`: The supplier profile data object, or null if the user is not a supplier.
 *  - `isLoading`: A boolean that is `true` while the user's auth state and profile are being fetched by the provider.
 */
export function useSupplierProfile() {
    const { user, supplierData, isUserLoading } = useUser();

    // Memoize the profile object to ensure stable references across re-renders.
    const supplierProfile = useMemo((): SupplierProfile | null => {
        if (!user || !supplierData) {
            return null;
        }
        // The data from the provider already has all the fields except the ID,
        // which we can get from the user object.
        return {
            id: user.uid,
            ...supplierData,
        } as SupplierProfile;
    }, [user, supplierData]);

    return { 
        supplierProfile,
        isLoading: isUserLoading
    };
}

'use client';

import { useUser } from '@/firebase/provider';

/**
 * Hook to determine if the current user is a supplier.
 *
 * This hook checks the `roles` array provided by the central `useUser` hook,
 * which is the single source of truth for user authentication and authorization data.
 * This avoids redundant database fetches and potential race conditions.
 *
 * @returns An object containing:
 *  - `isSupplier`: A boolean that is `true` if the user is a supplier, otherwise `false`.
 *  - `isLoading`: A boolean that is `true` while the user's auth state is being resolved by the provider.
 */
export function useSupplier() {
    const { roles, isUserLoading } = useUser();

    const isSupplier = roles.includes('supplier');

    return { 
        isSupplier, 
        isLoading: isUserLoading
    };
}

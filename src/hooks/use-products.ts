'use client';

import { useMemo } from 'react';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Product } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';

/**
 * Hook to fetch products for a specific supplier.
 * @param supplierId The UID of the supplier.
 * @param activeOnly Whether to only fetch active products.
 */
export function useProducts(supplierId?: string, activeOnly: boolean = true) {
    const firestore = useFirestore();

    const productsQuery = useMemo(() => {
        if (!firestore || !supplierId) return null;

        const baseQuery = query(
            collection(firestore, 'products').withConverter(createConverter<Product>()),
            where('supplierId', '==', supplierId),
            orderBy('createdAt', 'desc'),
            limit(100)
        );

        if (activeOnly) {
            return query(baseQuery, where('isActive', '==', true));
        }

        return baseQuery;
    }, [firestore, supplierId, activeOnly]);

    return useCollection(productsQuery);
}


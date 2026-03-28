'use client';

import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Order } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';

/**
 * Hook to fetch orders.
 * @param role Whether to fetch as 'user' or 'supplier'.
 * @param id The UID of the user or supplier.
 */
export function useOrders(role: 'user' | 'supplier', id?: string) {
    const firestore = useFirestore();

    const ordersQuery = useMemo(() => {
        if (!firestore || !id) return null;

        const field = role === 'user' ? 'userId' : 'supplierId';
        
        return query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()),
            where(field, '==', id),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, role, id]);

    return useCollection(ordersQuery);
}

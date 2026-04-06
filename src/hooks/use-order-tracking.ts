'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { Order } from '@/types/data';

/**
 * useOrderTracking Hook
 * Misión 3: Escucha en tiempo real el pedido activo del usuario.
 */
export function useOrderTracking() {
    const firestore = useFirestore();
    const { user } = useUser();
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firestore || !user?.uid) {
            setLoading(false);
            return;
        }

        // Buscamos el pedido más reciente que no esté en estado terminal
        const q = query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()),
            where('customerId', '==', user.uid),
            where('status', 'not-in', ['completed', 'cancelled']),
            orderBy('status'), // Necesario para el filtro 'not-in'
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setActiveOrder({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id });
            } else {
                setActiveOrder(null);
            }
            setLoading(false);
        }, (error) => {
            console.error('Order tracking error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firestore, user?.uid]);

    return { activeOrder, loading };
}

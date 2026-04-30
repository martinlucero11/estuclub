import { useState, useEffect, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Order } from '@/types/data';

export function useNewOrderAlarm(supplierId?: string) {
    const firestore = useFirestore();
    const [newOrder, setNewOrder] = useState<Order | null>(null);
    const initialLoad = useRef(true);

    // Track user interaction globally to allow audio playback
    useEffect(() => {
        const handleInteraction = () => {
            localStorage.setItem('estuclub_interacted', 'true');
        };
        
        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });
        
        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }, []);

    useEffect(() => {
        if (!firestore || !supplierId) return;

        const q = query(
            collection(firestore, 'orders'),
            where('supplierId', '==', supplierId),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (initialLoad.current) {
                // Ignore existing orders on mount
                initialLoad.current = false;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const orderData = { id: change.doc.id, ...change.doc.data() } as Order;
                    setNewOrder(orderData);
                }
            });
        });

        return () => unsubscribe();
    }, [firestore, supplierId]);

    const clearOrder = () => {
        setNewOrder(null);
    };

    return { newOrder, clearOrder };
}

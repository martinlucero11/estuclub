'use client';

import React, { useEffect, useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import type { Order } from '@/types/data';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptics';
import { AlertCircle, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * OrderStaleMonitor Component (Misión 5)
 * Monitorea pedidos en 'pending' por más de 180 segundos.
 */
export function OrderStaleMonitor() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [staleOrders, setStaleOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (!firestore) return;

        const q = query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = Date.now();
            const stale = snapshot.docs
                .map(doc => ({ ...doc.data(), id: doc.id } as Order))
                .filter(order => {
                    const createdAt = order.createdAt?.toMillis() || 0;
                    return (now - createdAt) > 180000; // 180 seconds
                });

            if (stale.length > staleOrders.length) {
                // Alerta sonora (opcional/discreta según pedido)
                try {
                    const audio = new Audio('/sounds/alert.mp3');
                    audio.volume = 0.3;
                    audio.play().catch(() => {}); // Puede fallar si no hay interacción
                } catch (e) {}

                haptic.vibrateError();
                toast({
                    title: "⚠️ PEDIDO ESTANCADO",
                    description: `Hay ${stale.length} pedidos esperando hace más de 3 minutos.`,
                    variant: 'destructive'
                });
            }
            setStaleOrders(stale);
        });

        return () => unsubscribe();
    }, [firestore, staleOrders.length, toast]);

    if (staleOrders.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="fixed bottom-6 right-6 z-[100]"
            >
                <div className="bg-[#cb465a] text-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(203, 70, 90,0.4)] flex items-center gap-4 border-2 border-white/20">
                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 italic">Atención Admin</p>
                        <h3 className="text-sm font-black uppercase tracking-tight">
                            {staleOrders.length} Pedidos en riesgo
                        </h3>
                    </div>
                    <div className="ml-4 h-8 w-8 bg-black/20 rounded-lg flex items-center justify-center">
                        <BellRing className="h-4 w-4 animate-bounce" />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

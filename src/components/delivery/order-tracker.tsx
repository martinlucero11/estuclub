'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useOrderTracking } from '@/hooks/use-order-tracking';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Clock, 
    Truck, 
    CheckCircle2, 
    MessageSquare, 
    ChevronRight,
    MapPin,
    Package,
    Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { OrderReviewModal } from '@/components/reviews/order-review-modal';

/**
 * OrderTracker Component (Misión 3: Corazón de Estuclub)
 * Un widget sticky persistente que muestra el estado del pedido en tiempo real.
 */
export function OrderTracker() {
    const { activeOrder, loading } = useOrderTracking();
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [showReview, setShowReview] = useState(false);

    // Mapeo de estados a labels y progreso
    const statusMap: Record<string, { label: string; icon: any; step: number }> = {
        pending: { label: 'Esperando confirmación...', icon: Clock, step: 10 },
        accepted: { label: 'Preparando tu pedido...', icon: Package, step: 30 },
        searching_rider: { label: 'Buscando repartidor...', icon: Navigation, step: 45 },
        assigned: { label: 'Repartidor asignado', icon: Navigation, step: 60 },
        at_store: { label: 'Repartidor en el local', icon: Navigation, step: 75 },
        shipped: { label: '¡Tu pedido está en camino!', icon: Truck, step: 90 },
        arrived: { label: '¡Rider en tu puerta!', icon: MapPin, step: 100 },
        delivered: { label: '¡Pedido entregado!', icon: CheckCircle2, step: 100 },
    };

    const currentStatus = activeOrder?.status || 'pending';
    const config = statusMap[currentStatus] || statusMap.pending;

    useEffect(() => {
        if (!activeOrder?.estimatedDeliveryTime) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const estTime = activeOrder.estimatedDeliveryTime instanceof Timestamp 
                ? activeOrder.estimatedDeliveryTime.toDate().getTime() 
                : 0;
            
            const diff = estTime - now;

            if (diff <= 0) {
                // MISSION 2: Fallback al llegar a 00:00
                if (['shipped', 'arrived'].includes(currentStatus)) {
                    setTimeLeft('Llegando en cualquier momento');
                } else {
                    setTimeLeft('Finalizando detalles...');
                }
                clearInterval(interval);
            } else {
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [activeOrder, currentStatus]);

    // MISSION 6: Trigger Review Modal on Delivery
    useEffect(() => {
        if (activeOrder?.status === 'delivered' && !activeOrder.reviewed) {
            setShowReview(true);
        }
    }, [activeOrder?.status, activeOrder?.reviewed]);

    if (loading || !activeOrder) return null;

    return (
        <>
        <AnimatePresence>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                className="sticky top-4 z-[50] px-4 w-full max-w-2xl mx-auto pointer-events-none"
            >
                <Card className="pointer-events-auto bg-background border border-border shadow-xl rounded-[2.5rem] p-5 overflow-hidden relative">
                    {/* Progress Background */}
                    <div className="absolute bottom-0 left-0 h-1 bg-primary/5 w-full">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${config.step}%` }}
                            className="h-full bg-primary"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary relative">
                                <config.icon className={cn("h-6 w-6", currentStatus === 'shipped' && "animate-bounce")} />
                                {currentStatus === 'pending' && <span className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping" />}
                            </div>
                            
                            <div className="space-y-0.5">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">
                                    {config.label}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black tracking-tighter text-foreground tabular-nums">
                                        {timeLeft}
                                    </span>
                                    {activeOrder.status === 'shipped' && (
                                        <Badge className="bg-emerald-500 text-white font-black text-[8px] px-2 py-0 animate-pulse">EN CAMINO</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-10 w-10 rounded-xl border-border hover:bg-emerald-50 text-emerald-500"
                                onClick={() => window.open(`https://wa.me/${activeOrder.supplierPhone?.replace(/\D/g, '')}`, '_blank')}
                            >
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                            
                            <Link href={`/orders/${activeOrder.id}`}>
                                <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl hover:bg-muted">
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                    
                    {activeOrder.riderName && (
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center">
                                    <Truck className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Repartidor: <span className="text-foreground">{activeOrder.riderName}</span>
                                </p>
                            </div>
                            {activeOrder.riderLocation && (
                                <p className="text-[9px] font-black text-primary uppercase tracking-tighter italic animate-pulse">
                                    RASTREO GPS ACTIVO
                                </p>
                            )}
                        </div>
                    )}
                </Card>
            </motion.div>
        </AnimatePresence>

        {activeOrder && (
            <OrderReviewModal 
                order={activeOrder} 
                isOpen={showReview} 
                onClose={() => setShowReview(false)} 
            />
        )}
        </>
    );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", className)}>
            {children}
        </span>
    );
}

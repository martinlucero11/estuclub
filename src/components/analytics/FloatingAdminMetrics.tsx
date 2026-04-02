'use client';

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollectionOnce } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShoppingCart, TrendingUp, X, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { subHours } from 'date-fns';
import { useAdmin } from '@/context/admin-context';

export function FloatingAdminMetrics() {
    const { roles } = useUser();
    const { isAdmin } = useAdmin();
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = React.useState(false);

    // Fetch telemetry from last 24h
    const yesterday = useMemo(() => subHours(new Date(), 24), []);
    
    // We use a simplified query for real-time vibe
    const { data: checkoutEvents } = useCollectionOnce(
        query(
            collection(firestore, 'analytics_events'),
            where('eventType', '==', 'checkout_initiated'),
            where('timestamp', '>', yesterday),
            limit(100)
        )
    );

    const { data: recentOrders } = useCollectionOnce(
        query(
            collection(firestore, 'orders'),
            where('createdAt', '>', yesterday),
            limit(100)
        )
    );

    const stats = useMemo(() => {
        const checkouts = checkoutEvents?.length || 0;
        const orders = recentOrders?.length || 0;
        const abandoned = Math.max(0, checkouts - orders);
        const conversionRate = checkouts > 0 ? (orders / checkouts) * 100 : 0;
        
        return { checkouts, orders, abandoned, conversionRate };
    }, [checkoutEvents, recentOrders]);

    if (!isAdmin) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-72"
                    >
                        <Card className="glass-premium border-estuclub-rosa/30 shadow-[0_0_50px_rgba(217,59,100,0.15)] overflow-hidden">
                            <div className="p-4 bg-estuclub-rosa/10 border-b border-estuclub-rosa/20 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-estuclub-rosa animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-estuclub-rosa">Telemetría Live (24h)</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-estuclub-rosa/20" onClick={() => setIsOpen(false)}>
                                    <X className="h-3 w-3 text-estuclub-rosa" />
                                </Button>
                            </div>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Checkouts</p>
                                        <p className="text-xl font-black text-white">{stats.checkouts}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase">Pedidos</p>
                                        <p className="text-xl font-black text-green-400">{stats.orders}</p>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-white/5 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                                                <ShoppingCart className="h-3 w-3" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300">Carritos Abandonados</span>
                                        </div>
                                        <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 font-black">
                                            {stats.abandoned}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-lg bg-estuclub-rosa/10 flex items-center justify-center text-estuclub-rosa">
                                                <TrendingUp className="h-3 w-3" />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300">Conversión Plataforma</span>
                                        </div>
                                        <span className="text-xs font-black text-estuclub-rosa">{stats.conversionRate.toFixed(1)}%</span>
                                    </div>
                                </div>

                                {stats.abandoned > 5 && (
                                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex gap-2">
                                        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                                        <p className="text-[9px] font-medium text-destructive-foreground">Detección de alta fricción en checkout. Revisar latencias.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="h-14 w-14 rounded-[2rem] bg-[#0A0A0A] border border-estuclub-rosa/50 shadow-[0_0_30px_rgba(217,59,100,0.3)] flex items-center justify-center text-estuclub-rosa hover:border-estuclub-rosa transition-all group overflow-hidden relative"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-estuclub-rosa/20 via-transparent to-transparent opacity-50" />
                {isOpen ? <X className="h-6 w-6 relative z-10" /> : <Activity className="h-6 w-6 relative z-10 animate-pulse" />}
            </motion.button>
        </div>
    );
}

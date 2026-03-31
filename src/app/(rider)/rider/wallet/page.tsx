'use client';

import React, { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Order, UserProfile } from '@/types/data';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Wallet, 
    TrendingUp, 
    History, 
    ArrowUpRight, 
    Calendar, 
    Clock, 
    MapPin, 
    Navigation,
    AlertTriangle,
    CheckCircle2,
    Store,
    DollarSign,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

export default function RiderWallet() {
    const { userData, user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    // Fetch completed orders for this rider
    const historyQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'orders'),
            where('riderId', '==', user.uid),
            where('status', '==', 'completed'),
            orderBy('updatedAt', 'desc'),
            limit(20)
        );
    }, [firestore, user?.uid]);

    const { data: completedOrders, isLoading: historyLoading } = useCollection(historyQuery);

    // Calculate total balance
    const totalBalance = useMemo(() => {
        if (!completedOrders) return 0;
        return completedOrders.reduce((sum, order) => sum + (order.deliveryCost || 0), 0);
    }, [completedOrders]);

    // Subscription logic
    const subscriptionDaysLeft = useMemo(() => {
        if (!userData?.subscriptionPaidAt) return 0;
        const paidAt = userData.subscriptionPaidAt.toDate();
        const expiryDate = new Date(paidAt);
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        return differenceInDays(expiryDate, new Date());
    }, [userData]);

    const isExpiringSoon = subscriptionDaysLeft > 0 && subscriptionDaysLeft <= 5;

    if (isUserLoading) return null;

    return (
        <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Wallet */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Billetera</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Gestión de ingresos y logística</p>
            </div>

            {/* Balance Card */}
            <Card className="rounded-[2.5rem] bg-gradient-to-br from-cyan-500 to-cyan-600 p-8 border-0 shadow-[0_20px_50px_rgba(6,182,212,0.3)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Wallet className="h-24 w-24 text-white" />
                </div>
                
                <div className="relative z-10 space-y-6">
                    <div className="space-y-1">
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" /> Saldo Disponible
                        </p>
                        <h2 className="text-5xl font-black tracking-tighter text-white">
                            ${totalBalance.toLocaleString('es-AR')}
                        </h2>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button 
                            onClick={() => { haptic.vibrateImpact(); setShowWithdrawModal(true); }}
                            className="bg-white text-cyan-600 hover:bg-white/90 font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl border-0 shadow-lg"
                        >
                            Retirar Dinero <ArrowUpRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20" />
            </Card>

            {/* Subscription Module */}
            <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-2">
                    <Calendar className="h-4 w-4" /> Estado de Membresía
                </h3>
                <Card className="bg-slate-900 border-white/5 rounded-3xl overflow-hidden glass shadow-premium">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center border animate-pulse",
                                isExpiringSoon ? "bg-orange-500/10 border-orange-500/30" : "bg-cyan-500/10 border-cyan-500/30"
                            )}>
                                {isExpiringSoon ? <AlertTriangle className="h-6 w-6 text-orange-400" /> : <CheckCircle2 className="h-6 w-6 text-cyan-400" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vencimiento en</p>
                                <p className={cn(
                                    "text-lg font-black tracking-tighter",
                                    isExpiringSoon ? "text-orange-400" : "text-white"
                                )}>
                                    {subscriptionDaysLeft > 0 ? `${subscriptionDaysLeft} Días` : 'Vencida'}
                                </p>
                            </div>
                        </div>
                        <Badge className={cn(
                            "px-4 py-1.5 font-black text-[10px] uppercase tracking-widest rounded-full border-0",
                            isExpiringSoon ? "bg-orange-500 text-white" : "bg-cyan-500 text-black"
                        )}>
                             Suscripción Activa
                        </Badge>
                    </CardContent>
                </Card>
            </section>

            {/* Earnings History */}
            <section className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-2">
                    <History className="h-4 w-4" /> Envios Finalizados
                </h3>
                
                <div className="space-y-4">
                    {historyLoading ? (
                        [1,2,3].map(i => <div key={i} className="h-24 w-full bg-slate-900/50 animate-pulse rounded-3xl" />)
                    ) : completedOrders?.length === 0 ? (
                        <div className="py-20 text-center opacity-30">
                            <Navigation className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sin entregas completadas</p>
                        </div>
                    ) : (
                        completedOrders?.map((order) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center group-hover:border-cyan-500/30 transition-colors">
                                        <Store className="h-6 w-6 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black tracking-tighter uppercase truncate max-w-[150px]">{order.supplierName}</h4>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="border-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase h-5">
                                                {order.distanceKm?.toFixed(1) || '0.0'} KM
                                            </Badge>
                                            <p className="text-[9px] font-bold text-slate-600 flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {order.updatedAt ? format(order.updatedAt.toDate(), "d MMM, HH:mm", { locale: es }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <div className="flex items-center justify-end text-cyan-400">
                                        <DollarSign className="h-3 w-3" />
                                        <span className="text-lg font-black tracking-tighter">{order.deliveryCost?.toLocaleString('es-AR')}</span>
                                    </div>
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Cobrado</p>
                                </div>
                            </motion.div>
                        ))
                    ) as any}
                </div>
            </section>

            {/* Withdraw Modal Placeholder */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowWithdrawModal(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90%] max-w-sm"
                        >
                            <Card className="bg-slate-900 border-cyan-500/30 rounded-[3rem] p-10 text-center space-y-6 glass shadow-[0_0_50px_rgba(0,245,255,0.1)]">
                                <div className="h-20 w-20 rounded-[2rem] bg-cyan-500/10 flex items-center justify-center mx-auto border border-cyan-500/20">
                                    <Info className="h-10 w-10 text-cyan-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black tracking-tighter uppercase italic text-cyan-400">Próximamente</h3>
                                    <p className="text-slate-400 font-medium text-xs leading-relaxed uppercase tracking-widest">
                                        Estamos activando los retiros inmediatos vía transferencia bancaria.
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => setShowWithdrawModal(false)}
                                    className="w-full h-14 bg-cyan-500 text-black font-black uppercase tracking-widest rounded-2xl shadow-lg"
                                >
                                    ¡ENTENDIDO!
                                </Button>
                            </Card>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Order, UserProfile } from '@/types/data';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, 
    CreditCard, 
    Navigation, 
    AlertCircle, 
    ExternalLink, 
    CheckCircle2, 
    Wallet, 
    Clock, 
    MapPin, 
    ArrowRight,
    Map as MapIcon,
    DollarSign,
    ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { haptic } from '@/lib/haptics';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Placeholder for the Map component
function RiderMap({ orders, onOrderSelect }: { orders: Order[], onOrderSelect: (order: Order) => void }) {
    return (
        <div className="w-full h-[50vh] bg-slate-900 rounded-[2.5rem] border border-cyan-500/20 shadow-[0_0_50px_rgba(0,245,255,0.05)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-50 z-10" />
            
            {/* Visual Placeholder for Google Maps with Neon Points */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <MapIcon className="h-12 w-12 text-cyan-400/20 mx-auto animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/40">Visualizando {orders.length} pedidos cercanos</p>
                </div>
            </div>

            {/* Interactive Points (Visual and Functional for the Demo) */}
            {orders.map((order, i) => (
                <motion.button
                    key={order.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.2 }}
                    onClick={() => onOrderSelect(order)}
                    style={{
                        position: 'absolute',
                        top: `${30 + (i * 15) % 40}%`,
                        left: `${20 + (i * 20) % 60}%`
                    }}
                    className="z-20 h-8 w-8 rounded-full bg-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.6)] border-2 border-black"
                >
                    <ShoppingBag className="h-4 w-4 text-black" />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md border border-cyan-400/20 text-[8px] px-2 py-0.5 rounded-full font-black text-cyan-400 uppercase tracking-widest">
                        ${order.deliveryCost}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}

export default function RiderDashboard() {
    const { userData, user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);

    // Filter orders searching for a rider
    const ordersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'orders'),
            where('status', '==', 'searching_rider')
        );
    }, [firestore]);

    const { data: availableOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

    // Calculate weekly earnings (Simulated for this view)
    const weeklyEarnings = useMemo(() => {
        // In a real app we'd fetch completed orders for this rider
        return 0; 
    }, []);

    if (isUserLoading) return null;

    // --- SECURITY WALL ---
    const isSubscribed = userData?.subscriptionStatus === 'active';
    const isMpLinked = userData?.mp_linked === true;

    if (!isSubscribed || !isMpLinked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <div className="h-20 w-20 rounded-[2rem] bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,245,255,0.2)]">
                    <AlertCircle className="h-10 w-10 text-cyan-400" />
                </div>
                
                <div className="space-y-3">
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic">Acceso Restringido</h1>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm leading-relaxed">
                        Para recibir pedidos debes estar al día con tu suscripción y tener vinculada tu cuenta de cobros.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                    {!isMpLinked ? (
                        <Button asChild className="h-14 bg-cyan-500 text-black font-black uppercase tracking-widest hover:bg-cyan-400 transition-all rounded-2xl">
                            <Link href={`/api/auth/mercadopago?userId=${user?.uid}`}>
                                <CreditCard className="mr-2 h-5 w-5" /> Vincular Mercado Pago
                            </Link>
                        </Button>
                    ) : (
                        <div className="h-14 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest">
                            <CheckCircle2 className="h-5 w-5" /> Cuenta Vinculada
                        </div>
                    )}

                    {!isSubscribed && (
                        <Button className="h-14 bg-transparent border-2 border-cyan-500 text-cyan-400 font-black uppercase tracking-widest hover:bg-cyan-500/10 transition-all rounded-2xl">
                            <Link href="/rider/subscribe">
                                <Wallet className="mr-2 h-5 w-5" /> Activar Suscripción ($25k)
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // --- DASHBOARD ---
    const handleAcceptOrder = async () => {
        if (!selectedOrder || !user?.uid) return;
        
        setIsAccepting(true);
        haptic.vibrateMedium();
        
        try {
            const orderRef = doc(firestore, 'orders', selectedOrder.id);
            await updateDoc(orderRef, {
                riderId: user.uid,
                status: 'assigned',
                updatedAt: Timestamp.now()
            });
            setSelectedOrder(null);
            // Redirect or show success
        } catch (error) {
            console.error('Error accepting order:', error);
        } finally {
            setIsAccepting(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Wallet Overview */}
            <header className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900/50 border-cyan-500/10 rounded-[2rem] overflow-hidden glass shadow-premium">
                    <CardHeader className="p-4 bg-cyan-500/5 border-b border-cyan-500/10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 opacity-60">Balance Semanal</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black tracking-tighter text-cyan-400">$0,00</span>
                            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,245,255,1)]" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/50 border-cyan-500/10 rounded-[2rem] overflow-hidden glass shadow-premium">
                    <CardHeader className="p-4 bg-cyan-500/5 border-b border-cyan-500/10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 opacity-60">Suscripción</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <Badge className="bg-cyan-500 text-black font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full border-0">ACTIVA</Badge>
                    </CardContent>
                </Card>
            </header>

            {/* Map Area */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <Navigation className="h-4 w-4 animate-bounce" /> Pedidos en Vivo
                    </h2>
                    <Badge variant="outline" className="border-cyan-500/20 text-cyan-400 font-black text-[9px]">RADIO 5KM</Badge>
                </div>
                
                <RiderMap orders={availableOrders || []} onOrderSelect={setSelectedOrder} />
            </section>

            {/* Bottom Sheet to accept order */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-[70] bg-[#0A0A0A] border-t border-cyan-500/30 rounded-t-[3rem] p-8 pb-12 shadow-[0_-20px_50px_rgba(0,245,255,0.1)]"
                        >
                            <div className="w-12 h-1.5 bg-cyan-500/20 rounded-full mx-auto mb-8" />
                            
                            <div className="space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tighter uppercase italic text-cyan-400">Detalles del Envío</h3>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">ID: {selectedOrder.id.slice(0, 8)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Tu ganancia</p>
                                        <p className="text-4xl font-black tracking-tighter text-cyan-400">${selectedOrder.deliveryCost}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                            <Navigation className="h-5 w-5 text-cyan-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Distancia</p>
                                            <p className="text-sm font-bold">2.4 km</p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                            <Clock className="h-5 w-5 text-cyan-400" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Tiempo</p>
                                            <p className="text-sm font-bold">12 min</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <MapPin className="h-4 w-4 text-cyan-400" />
                                        <span className="text-xs font-bold uppercase tracking-tight truncate flex-1">{selectedOrder.supplierName}</span>
                                        <ArrowRight className="h-3 w-3 opacity-30" />
                                        <span className="text-xs font-bold uppercase tracking-tight truncate flex-1">{selectedOrder.deliveryAddress}</span>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleAcceptOrder}
                                    disabled={isAccepting}
                                    className="w-full h-16 bg-cyan-500 text-black font-black text-lg uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all rounded-[2rem] shadow-[0_0_30px_rgba(0,245,255,0.3)] mt-6"
                                >
                                    {isAccepting ? "Procesando..." : "ACEPTAR ENVÍO"}
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';
export const dynamic = 'force-dynamic';

import React, { useMemo } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Order } from '@/types/data';
import { motion } from 'framer-motion';
import { 
    ShoppingBag, 
    Clock, 
    CheckCircle2, 
    MapPin, 
    Bike,
    Truck,
    History,
    ChevronRight,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { createConverter } from '@/lib/firestore-converter';

export default function RiderOrdersPage() {
    const { user, userData, roles, isUserLoading } = useUser();
    const firestore = useFirestore();

    const ordersQuery = useMemo(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()), 
            where('riderId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user?.uid]);

    const { data: myOrders, isLoading } = useCollection(ordersQuery);

    const activeOrders = useMemo(() => myOrders?.filter(o => ['assigned', 'at_store', 'on_the_way'].includes(o.status)) || [], [myOrders]);
    const recentHistory = useMemo(() => myOrders?.filter(o => ['delivered', 'completed'].includes(o.status)) || [], [myOrders]);

    if (isUserLoading) return null;

    return (
        <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white font-montserrat">Mis Entregas</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Gestión de pedidos asignados</p>
            </div>

            {/* Active Orders List */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#d93b64] flex items-center gap-2 font-montserrat">
                        <div className="h-2 w-2 rounded-full bg-[#d93b64] animate-ping" /> Pedidos en Curso
                    </h2>
                    <Badge className="bg-[#d93b64]/10 text-[#d93b64] border-[#d93b64]/20 text-[9px] uppercase font-black px-3">{activeOrders.length}</Badge>
                </div>

                <div className="space-y-4">
                    {activeOrders.length === 0 ? (
                        <div className="py-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2.5rem]">
                            <Search className="h-8 w-8 mx-auto mb-3 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No tenés pedidos activos en este momento</p>
                        </div>
                    ) : (
                        activeOrders.map(order => (
                            <motion.div key={order.id} whileHover={{ scale: 1.01 }} className="group">
                                <Card className="bg-white/[0.03] border-white/5 rounded-[2.5rem] overflow-hidden group-hover:border-[#d93b64]/30 transition-all shadow-xl">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center">
                                                    <Truck className="h-6 w-6 text-[#d93b64]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-white italic uppercase tracking-tight text-lg">{order.supplierName}</h3>
                                                    <p className="text-[10px] font-black uppercase text-[#d93b64] tracking-widest">{order.status.replace('_', ' ')}</p>
                                                </div>
                                            </div>
                                            <p className="text-xl font-black tracking-tighter text-white font-inter">${order.deliveryCost}</p>
                                        </div>

                                        <div className="space-y-4 border-t border-white/5 pt-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-400 leading-tight">{order.deliveryAddress}</p>
                                            </div>
                                        </div>

                                        <Button asChild className="w-full h-14 mt-6 bg-[#d93b64] hover:bg-[#d93b64]/90 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-[#d93b64]/20 border-0">
                                            <Link href={`/rider/trip/${order.id}`}>Seguir Viaje <ChevronRight className="ml-2 h-4 w-4" /></Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </section>

            {/* Recent History List */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 font-montserrat">
                        <History className="h-4 w-4" /> Historial de Entregas
                    </h2>
                    <Button variant="link" className="text-[10px] font-black uppercase tracking-widest text-slate-600">Ver Historial</Button>
                </div>

                <div className="space-y-1">
                    {recentHistory.slice(0, 10).map((order, i) => (
                        <motion.div 
                            key={order.id} 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white/[0.01] border-b border-white/5 p-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-black text-white uppercase italic">{order.supplierName}</p>
                                    <p className="text-[10px] font-bold text-slate-600 uppercase">
                                        {order.createdAt instanceof Timestamp ? format(order.createdAt.toDate(), "d MMM, HH:mm", { locale: es }) : 'Finalizada'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-white font-inter">${order.deliveryCost}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-green-500/60">Pagado</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}


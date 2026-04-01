'use client';

import React, { useMemo, Suspense } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { ShoppingBag, Clock, CheckCircle2, Truck, Package, Store, ChevronRight, Hash, ArrowUpRight, Navigation, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createConverter } from '@/lib/firestore-converter';
import type { Order } from '@/types/data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ─── CONFIG ───────────────────────────────────────────────
const statusConfig = {
    pending_payment: { label: 'Pago Pendiente', icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    searching_rider: { label: 'Buscando Rider', icon: Navigation, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
    accepted: { label: 'En Preparación', icon: Store, color: 'text-[#d93b64] bg-[#d93b64]/10 border-[#d93b64]/20' },
    assigned: { label: 'Rider Asignado', icon: Package, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
    at_store: { label: 'En Local', icon: Store, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
    on_the_way: { label: 'En Camino', icon: Truck, color: 'text-[#d93b64] bg-[#d93b64]/10 border-[#d93b64]/20' },
    delivered: { label: 'Entregado', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    completed: { label: 'Finalizado', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    cancelled: { label: 'Cancelado', icon: Hash, color: 'text-destructive bg-destructive/10 border-destructive/20' },
    paid: { label: 'Pagado', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
};

// ─── SKELETON ──────────────────────────────────────────────
function OrdersSkeleton() {
    return (
        <div className="space-y-8 p-10 mt-40 max-w-7xl mx-auto">
            <Skeleton className="h-40 w-full rounded-[3rem]" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="h-80 rounded-[3rem]" />
                <Skeleton className="h-80 rounded-[3rem]" />
            </div>
        </div>
    );
}

// ─── DASHBOARD CONTENT ─────────────────────────────────────
function OrdersDashboard() {
    const firestore = useFirestore();
    const { user } = useUser();

    const ordersQuery = useMemo(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
    }, [firestore, user]);

    const { data: orders, isLoading } = useCollection(ordersQuery);

    const activeOrders = useMemo(() => orders?.filter(o => !['completed', 'cancelled', 'delivered'].includes(o.status)) || [], [orders]);
    const recentHistory = useMemo(() => orders?.filter(o => ['completed', 'delivered'].includes(o.status)).slice(0, 10) || [], [orders]);

    if (isLoading) return <OrdersSkeleton />;

    if (!orders || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 p-10">
                <div className="relative">
                    <div className="h-32 w-32 bg-primary/5 rounded-full flex items-center justify-center animate-pulse">
                        <ShoppingBag className="h-12 w-12 text-primary opacity-20" />
                    </div>
                    <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase text-slate-800">Cero Entregas</h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tu historial logístico está vacío.</p>
                </div>
                <Button asChild className="h-14 px-10 bg-primary rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30">
                    <Link href="/delivery">Realizar Pedido</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-20 animate-in fade-in duration-1000">
            {/* ACTIVE TRACKING HUB */}
            {activeOrders.length > 0 && (
                <section className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="h-1 w-12 bg-primary rounded-full" />
                            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary italic">En Tiempo Real</h2>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {activeOrders.map(order => {
                            const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending_payment;
                            return (
                                <Link key={order.id} href={`/orders/${order.id}`} className="group">
                                    <Card className="relative h-full bg-white border border-primary/5 rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.02)] hover:shadow-2xl hover:border-primary/20 transition-all duration-500">
                                        <div className="absolute top-0 right-0 p-8">
                                            <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center -rotate-12 group-hover:rotate-0 transition-transform">
                                                <config.icon className="h-8 w-8 text-primary opacity-30" />
                                            </div>
                                        </div>
                                        <CardContent className="p-10 flex flex-col justify-between h-full space-y-12">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4">
                                                    <Badge className={cn("px-4 py-2 font-black uppercase tracking-widest text-[9px] rounded-xl shadow-lg border-0", config.color)}>
                                                        {config.label}
                                                    </Badge>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">#{order.id.slice(-6)}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{order.supplierName}</h3>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{order.items.length} Productos • {order.type === 'delivery' ? 'Envío' : 'Takeaway'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-6 pt-6 border-t border-slate-50">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 flex items-center justify-center bg-slate-50 rounded-xl">
                                                        <MapPin className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 italic max-w-xs">{order.deliveryAddress}</p>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-4xl font-black tracking-tighter text-slate-900">${order.totalAmount.toLocaleString()}</p>
                                                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:translate-x-2 transition-transform">
                                                        <ArrowUpRight className="h-6 w-6" />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* HISTORY LOG */}
            <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="h-1 w-12 bg-slate-200 rounded-full" />
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 italic">Cronología</h2>
                    </div>
                </div>

                <div className="grid gap-4">
                    {recentHistory.map((order, i) => (
                        <motion.div 
                            key={order.id} 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link href={`/orders/${order.id}`}>
                                <Card className="group bg-white/50 border border-slate-100/50 rounded-[2rem] p-6 hover:bg-white hover:border-primary/20 hover:shadow-xl transition-all duration-300">
                                    <div className="flex items-center justify-between gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100/50 group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors">
                                                {order.status === 'completed' ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <Package className="h-6 w-6 text-slate-300" />}
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-lg font-black tracking-tighter uppercase italic text-slate-800">{order.supplierName}</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {order.createdAt instanceof Timestamp ? format(order.createdAt.toDate(), "d MMM • HH:mm", { locale: es }) : 'Finalizada'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black tracking-tighter text-slate-900">${order.totalAmount.toLocaleString()}</p>
                                            <Badge variant="outline" className="mt-1 border-slate-100 text-[8px] font-black uppercase tracking-tighter text-slate-400 rounded-lg">ID {order.id.slice(-6)}</Badge>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────
export default function StudentOrdersPage() {
    return (
        <MainLayout>
            <div className="relative min-h-screen bg-[#FDFDFD]">
                {/* Visual Anchors */}
                <div className="absolute top-0 right-0 w-full h-[600px] pointer-events-none -z-10">
                    <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-primary/5 blur-[120px] rounded-full animate-float-orb" />
                </div>
                
                <div className="max-w-7xl mx-auto px-6 pt-40 md:pt-52 pb-32">
                    {/* Minimalist Hero */}
                    <header className="mb-24 space-y-12">
                        <div className="space-y-4">
                            <Badge className="bg-primary/10 text-primary border-primary/20 px-6 py-2 rounded-2xl font-black uppercase tracking-[0.2em] italic text-[10px] shadow-sm">
                                Centro Logístico Estudiantil
                            </Badge>
                            <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter uppercase italic text-slate-900 leading-[0.7] select-none">
                                Mis <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-pink-300">Pedidos</span>
                            </h1>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-8 border-t border-slate-100 pt-10">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Estado del Pulso</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sistemas Operativos</p>
                                </div>
                            </div>
                            <div className="hidden md:block h-10 w-px bg-slate-100" />
                            <p className="text-xs md:text-sm text-slate-400 font-bold max-w-sm italic leading-relaxed uppercase tracking-widest opacity-60">
                                Sigue el latido de tus entregas en tiempo real. Desde el local hasta tu puerta.
                            </p>
                        </div>
                    </header>

                    <Suspense fallback={<OrdersSkeleton />}>
                        <OrdersDashboard />
                    </Suspense>
                </div>
            </div>
        </MainLayout>
    );
}

import { Button } from '@/components/ui/button';

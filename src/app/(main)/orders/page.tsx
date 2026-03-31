'use client';

import MainLayout from '@/components/layout/main-layout';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Suspense, useMemo } from 'react';
import { ShoppingBag, Clock, CheckCircle2, Truck, XCircle, ChevronRight, Package, Store } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createConverter } from '@/lib/firestore-converter';
import type { Order, SerializableOrder } from '@/types/data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';

function OrdersListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-3xl" />
            ))}
        </div>
    );
}

const statusConfig = {
    pending_payment: { label: 'Pago Pendiente', icon: Clock, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    searching_rider: { label: 'Buscando Rider', icon: Package, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.2)]' },
    accepted: { label: 'En Preparación', icon: Store, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20' },
    assigned: { label: 'Rider Asignado', icon: Package, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
    at_store: { label: 'Retirando', icon: Store, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
    on_the_way: { label: 'En Camino', icon: Truck, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.3)]' },
    delivered: { label: 'Entregado', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    completed: { label: 'Finalizado', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-destructive bg-destructive/10 border-destructive/20' },
    paid: { label: 'Pagado', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
};

function OrdersList() {
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

    const { data: orders, isLoading, error } = useCollection(ordersQuery);

    if (isLoading) return <OrdersListSkeleton />;
    
    if (error) {
        return (
            <div className="text-center py-20 space-y-4 glass rounded-[2.5rem] border-destructive/20 bg-destructive/5">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="text-destructive font-bold text-xl uppercase tracking-tighter">Error crítico de acceso</p>
                <p className="text-muted-foreground italic text-xs">{error.message}</p>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-32 space-y-6 glass rounded-[3rem] border-white/5 bg-white/5 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <ShoppingBag className="h-10 w-10 text-primary opacity-50" />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">No tienes pedidos aún</h3>
                <p className="text-slate-400 font-bold text-sm max-w-xs mx-auto italic">
                    ¿Hambre de beneficios? Explora los locales y haz tu primer pedido.
                </p>
                <Link href="/delivery" className="inline-block pt-4">
                    <button className="px-10 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-[0_15px_30px_rgba(236,72,153,0.3)]">
                        EXPLORAR DELIVERY
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {orders.map((order) => {
                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending_payment;
                const StatusIcon = config.icon;
                
                return (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                        <Card className="group overflow-hidden rounded-[2.5rem] border-white/5 bg-[#0A0A0A] hover:border-white/10 hover:bg-white/[0.02] transition-all duration-500 my-4">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row justify-between gap-8">
                                    <div className="space-y-5">
                                        <div className="flex items-center gap-3">
                                            <Badge className={cn("px-4 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-xl border transition-all", config.color)}>
                                                <StatusIcon className="h-3 w-3 mr-2" />
                                                {config.label}
                                            </Badge>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {order.createdAt ? format(order.createdAt.toDate(), "d MMM • HH:mm", { locale: es }) : 'Reciente'}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-black italic tracking-tighter text-white group-hover:text-primary transition-colors flex items-center gap-3">
                                                {order.supplierName}
                                                <ChevronRight className="h-5 w-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic line-clamp-1">
                                                {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-col justify-between items-end md:gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Total Invertido</p>
                                            <p className="text-3xl font-black italic tracking-tighter text-white group-hover:text-pink-500 transition-colors">
                                                ${order.totalAmount.toLocaleString()}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="rounded-2xl border-white/5 font-black text-[8px] uppercase tracking-widest py-1 bg-white/5 px-4 text-slate-500">
                                            {order.type === 'delivery' ? 'Domicilio' : 'Retiro'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}

export default function StudentOrdersPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-12 p-4 md:p-12 max-w-5xl mx-auto pb-32">
                <header className="space-y-6 pt-8">
                    <div className="inline-flex items-center gap-3 px-5 py-2 bg-pink-500/10 rounded-2xl border border-pink-500/20 shadow-xl shadow-pink-500/5">
                        <ShoppingBag className="h-5 w-5 text-pink-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">Logística de Estudiante</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic uppercase">
                            Mis <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-pink-300">Pedidos</span>
                        </h1>
                        <p className="text-sm md:text-lg text-slate-400 font-bold max-w-2xl leading-relaxed italic border-l-2 border-pink-500/30 pl-4 py-1">
                            Sigue el latido de tus entregas en tiempo real. Desde el local hasta tu puerta, Estuclub te conecta.
                        </p>
                    </div>
                </header>

                <Suspense fallback={<OrdersListSkeleton />}>
                    <OrdersList />
                </Suspense>
            </div>
        </MainLayout>
    );
}

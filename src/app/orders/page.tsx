'use client';

import MainLayout from '@/components/layout/main-layout';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Suspense, useMemo } from 'react';
import { ShoppingBag, Clock, CheckCircle2, Truck, XCircle, ChevronRight, Package } from 'lucide-react';
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
    pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
    accepted: { label: 'En Preparación', icon: Package, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    shipped: { label: 'En Camino', icon: Truck, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    completed: { label: 'Entregado', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-destructive bg-destructive/10 border-destructive/20' },
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
            <div className="text-center py-20 space-y-4 glass rounded-[2.5rem] border-destructive/20">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <p className="text-destructive font-bold text-xl">Error al cargar tus pedidos</p>
                <p className="text-muted-foreground">{error.message}</p>
            </div>
        );
    }

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-32 space-y-6 glass rounded-[3rem] border-white/5 bg-white/5 backdrop-blur-sm">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="h-10 w-10 text-primary opacity-50" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">No tienes pedidos aún</h3>
                <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                    ¿Hambre? Explora los locales con delivery y haz tu primer pedido.
                </p>
                <Link href="/delivery">
                    <button className="mt-4 px-8 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-lg shadow-primary/25">
                        Ir a Delivery
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {orders.map((order) => {
                const config = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                    <Card key={order.id} className="group overflow-hidden rounded-[2rem] border-white/10 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Badge className={cn("px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-full border", config.color)}>
                                            <StatusIcon className="h-3 w-3 mr-1.5" />
                                            {config.label}
                                        </Badge>
                                        <span className="text-xs font-bold text-muted-foreground">
                                            {order.createdAt ? format(order.createdAt.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Reciente'}
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-xl font-black tracking-tighter group-hover:text-primary transition-colors">
                                            {order.supplierName}
                                        </h3>
                                        <p className="text-sm font-medium text-muted-foreground italic">
                                            {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col justify-between items-end gap-2">
                                    <div className="text-right">
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Total</p>
                                        <p className="text-2xl font-black tracking-tighter text-primary">
                                            ${order.totalAmount.toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="rounded-xl border-white/10 font-bold bg-white/5">
                                        {order.type === 'delivery' ? 'Envío a domicilio' : 'Retiro por local'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

export default function StudentOrdersPage() {
    return (
        <MainLayout>
            <BackButton />
            <div className="flex-1 space-y-12 p-4 md:p-12 max-w-5xl mx-auto">
                <header className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
                        <Package className="h-5 w-5 text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Mis Pedidos</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                        Historial de <span className="text-primary">Delivery</span>
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed italic opacity-80">
                        Sigue el estado de tus pedidos en tiempo real y revive tus mejores comidas.
                    </p>
                </header>

                <Suspense fallback={<OrdersListSkeleton />}>
                    <OrdersList />
                </Suspense>
            </div>
        </MainLayout>
    );
}

'use client';

import React, { useMemo, useState } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useAdmin } from '@/context/admin-context';
import { collection, query, where, orderBy, limit, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { 
    Clock, 
    CheckCircle2, 
    Truck, 
    XCircle, 
    Package, 
    Check,
    AlertCircle,
    User,
    MapPin,
    Phone,
    ShoppingBag,
    Navigation,
    ChevronDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { createConverter } from '@/lib/firestore-converter';
import type { Order } from '@/types/data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { haptic } from '@/lib/haptics';
import { getLiveShippingRate } from '@/lib/shipping';

const statusConfig = {
    pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
    accepted: { label: 'En Preparación', icon: Package, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    searching_rider: { 
        label: 'Buscando Rider...', 
        icon: Navigation, 
        color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30 shadow-[0_0_15px_rgba(0,245,255,0.2)] animate-pulse' 
    },
    assigned: { label: 'Rider Asignado', icon: User, color: 'text-green-400 bg-green-400/10 border-green-400/20' },
    shipped: { label: 'En Camino', icon: Truck, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    completed: { label: 'Entregado', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-destructive bg-destructive/10 border-destructive/20' },
};

export default function OrdersDashboard({ supplierId: propSupplierId }: { supplierId?: string }) {
    const firestore = useFirestore();
    const { user, supplierData: ownSupplierData, roles } = useUser();
    const { impersonatedSupplierData } = useAdmin();
    const { toast } = useToast();
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Determine the active supplier context
    const supplierId = propSupplierId || user?.uid;
    const supplierData = propSupplierId && propSupplierId !== user?.uid ? impersonatedSupplierData : ownSupplierData;

    const ordersQuery = useMemo(() => {
        if (!firestore || !supplierId) return null;
        return query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()),
            where('supplierId', '==', supplierId),
            orderBy('createdAt', 'desc'),
            limit(50)
        );
    }, [firestore, supplierId]);

    const { data: orders, isLoading } = useCollection(ordersQuery);

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        if (statusFilter === 'all') return orders;
        return orders.filter(o => o.status === statusFilter);
    }, [orders, statusFilter]);

    const handleUpdateStatus = async (order: Order, newStatus: Order['status']) => {
        if (!firestore) return;
        haptic.vibrateSubtle();
        
        try {
            const orderRef = doc(firestore, 'orders', order.id);
            let updatePayload: any = {
                status: newStatus,
                updatedAt: serverTimestamp()
            };

            // LOGISTICS AUTOMATION: If accepted and delivery, find a rider
            if (newStatus === 'accepted' && order.type === 'delivery') {
                const origin = supplierData?.location?.address || supplierData?.address || '';
                const destination = order.deliveryAddress || '';

                if (origin && destination) {
                    const shipping = await getLiveShippingRate(origin, destination);
                    if (shipping.success) {
                        updatePayload.status = 'searching_rider';
                        updatePayload.deliveryCost = shipping.rate;
                        updatePayload.distanceKm = shipping.distanceKm;
                        updatePayload.logisticsMetadata = {
                            supplierLocation: supplierData?.location || null,
                            durationMin: shipping.durationMin
                        };
                    }
                }
            }

            await updateDoc(orderRef, updatePayload);
            
            const displayStatus = updatePayload.status as keyof typeof statusConfig;
            toast({
                title: "Estado actualizado",
                description: `Pedido marcado como: ${statusConfig[displayStatus].label}`,
            });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al actualizar estado", variant: "destructive" });
        }
    };

    const stats = useMemo(() => {
        if (!orders) return { pending: 0, today: 0, revenue: 0 };
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return orders.reduce((acc, order) => {
            if (order.status === 'pending') acc.pending++;
            
            const orderDate = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date();
            if (orderDate >= today && order.status !== 'cancelled') {
                acc.today++;
                acc.revenue += order.totalAmount;
            }
            return acc;
        }, { pending: 0, today: 0, revenue: 0 });
    }, [orders]);

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Stats Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-[2rem] border-white/5 bg-yellow-500/5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Pendientes</p>
                        <CardTitle className="text-3xl font-black tracking-tight">{stats.pending}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="rounded-[2rem] border-white/5 bg-blue-500/5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><ShoppingBag className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Pedidos Hoy</p>
                        <CardTitle className="text-3xl font-black tracking-tight">{stats.today}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="rounded-[2rem] border-white/5 bg-green-500/5 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle2 className="h-12 w-12" /></div>
                    <CardHeader className="pb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Ventas Hoy</p>
                        <CardTitle className="text-3xl font-black tracking-tight">${stats.revenue.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="rounded-[2.5rem] border-white/5 bg-card/50 backdrop-blur-sm shadow-premium overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-2xl font-black tracking-tighter">Pedidos Recientes</CardTitle>
                            <CardDescription className="italic font-medium">Gestiona y actualiza los pedidos de tus clientes.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-full">
                            {(['all', 'pending', 'accepted', 'searching_rider', 'assigned', 'shipped', 'completed', 'cancelled'] as const).map(s => (
                                <Button 
                                    key={s}
                                    variant={statusFilter === s ? 'secondary' : 'ghost'} 
                                    size="sm"
                                    onClick={() => setStatusFilter(s)}
                                    className={cn("rounded-xl h-8 px-3 text-[10px] font-black uppercase tracking-widest transition-all shrink-0", statusFilter === s && "shadow-lg")}
                                >
                                    {s === 'all' ? 'Todos' : statusConfig[s].label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        {filteredOrders.length === 0 ? (
                            <div className="py-20 text-center space-y-4 opacity-50">
                                <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                                <p className="font-bold uppercase tracking-widest text-xs">No hay pedidos registrados</p>
                            </div>
                        ) : (
                            filteredOrders.map(order => {
                                const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                                return (
                                    <div key={order.id} className="p-6 md:p-8 hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="space-y-4 flex-1">
                                                <div className="flex items-center justify-between md:justify-start gap-4">
                                                    <Badge className={cn("px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-full border shadow-sm", config.color)}>
                                                        <config.icon className="mr-1.5 h-3 w-3" />
                                                        {config.label}
                                                    </Badge>
                                                    <span className="text-xs font-bold text-muted-foreground">
                                                        #{order.id.slice(-6).toUpperCase()} • {order.createdAt ? format(order.createdAt.toDate(), "HH:mm", { locale: es }) : 'Ahora'}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div>
                                                            <span className="font-black tracking-tight">{order.userName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1.5 font-medium"><Phone className="h-3 w-3" />{order.userPhone || 'No registrado'}</div>
                                                        <div className="flex items-start gap-2 text-xs text-muted-foreground pl-1.5 font-medium italic"><MapPin className="h-3 w-3 mt-0.5" /><span className="line-clamp-1">{order.deliveryAddress}</span></div>
                                                    </div>
                                                    <div className="bg-white/5 rounded-2xl p-4 space-y-2 border border-white/5">
                                                        {order.items.map((item, i) => (
                                                            <div key={i} className="flex justify-between text-xs font-bold">
                                                                <span>{item.quantity}x {item.name}</span>
                                                                <span className="text-muted-foreground">${(item.price * item.quantity).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                        <div className="border-t border-white/5 pt-2 mt-2 flex justify-between text-sm font-black">
                                                            <span className="uppercase tracking-tighter">Total</span>
                                                            <span className="text-primary">${order.totalAmount.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row md:flex-col gap-2 justify-end">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-10 px-6">Cambiar Estado <ChevronDown className="ml-2 h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="rounded-2xl border-white/5 glass glass-dark w-48">
                                                        {(['pending', 'accepted', 'searching_rider', 'assigned', 'shipped', 'completed', 'cancelled'] as const).map(s => (
                                                            <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(order, s)} className="rounded-xl font-bold focus:bg-primary/20">{statusConfig[s].label}</DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Button variant="outline" size="icon" className="rounded-2xl border-white/10 hover:bg-white/10 h-10 w-10" onClick={() => window.open(`https://wa.me/${order.userPhone?.replace(/\D/g, '')}`, '_blank')}><Phone className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

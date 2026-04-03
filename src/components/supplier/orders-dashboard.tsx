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
import type { Order, SupplierProfile } from '@/types/data';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeliverySettings } from './delivery-settings';
import { Switch } from '@/components/ui/switch';

const statusConfig = {
    pending: { label: 'Pendiente', icon: Clock, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
    accepted: { label: 'En Preparación', icon: Package, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    searching_rider: { 
        label: 'Buscando Rider...', 
        icon: Navigation, 
        color: 'text-pink-400 bg-pink-400/10 border-pink-400/30 shadow-[0_0_15px_rgba(203, 70, 90,0.2)] animate-pulse' 
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
    const [activeTab, setActiveTab] = useState<string>('orders');

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
    const handleTogglePause = async () => {
        if (!firestore || !supplierId) return;
        const newStatus = !supplierData?.isDeliveryPaused;
        haptic.vibrateSubtle();
        try {
            await updateDoc(doc(firestore, 'roles_supplier', supplierId), {
                isDeliveryPaused: newStatus,
                updatedAt: serverTimestamp()
            });
            toast({ 
                title: newStatus ? "Local CERRADO" : "Local ABIERTO", 
                description: newStatus ? "Ya no aparecerás en la lista de pedidos." : "Los estudiantes ya pueden verte en la lista.",
                variant: newStatus ? "destructive" : "default"
            });
        } catch (e) {
            toast({ title: "Error", variant: "destructive", description: "No se pudo cambiar el estado." });
        }
    };

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></div>;

    const isClosed = supplierData?.isDeliveryPaused === true;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Master Switch - Sticky in Header context */}
            <Card className={cn(
                "rounded-[2.5rem] border-2 transition-all p-6 md:p-8 flex items-center justify-between shadow-2xl relative overflow-hidden",
                isClosed ? "bg-destructive/5 border-destructive/20" : "bg-green-500/5 border-green-500/20"
            )}>
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                   {isClosed ? <XCircle className="h-16 w-16" /> : <CheckCircle2 className="h-16 w-16" />}
                </div>
                
                <div className="space-y-1">
                    <h3 className={cn("text-xs font-black uppercase tracking-widest", isClosed ? "text-destructive" : "text-green-500")}>
                        {isClosed ? "ESTADO: CERRADO" : "ESTADO: ABIERTO"}
                    </h3>
                    <p className="text-[10px] font-bold text-foreground uppercase opacity-60">
                        {isClosed ? "Tu local no aparece en la lista de los estudiantes." : "Estás recibiendo pedidos activamente."}
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-background/50 p-2 rounded-3xl border border-white/5 backdrop-blur-md">
                    <span className={cn("text-[9px] font-black uppercase px-2", isClosed ? "text-foreground" : "text-primary italic animate-pulse")}>
                        {isClosed ? "CERRAR" : "EN LÍNEA"}
                    </span>
                    <Switch 
                        checked={!isClosed} 
                        onCheckedChange={handleTogglePause}
                        className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-destructive"
                    />
                </div>
            </Card>

            <Tabs defaultValue="orders" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mx-auto max-w-md mb-10 h-14 p-2 glass glass-dark rounded-[2rem] border border-white/5">
                    <TabsTrigger value="orders" className="font-extrabold rounded-[1.5rem] data-[state=active]:shadow-lg text-xs uppercase tracking-widest gap-2">
                        <Package className="h-4 w-4" /> Pedidos
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="font-extrabold rounded-[1.5rem] data-[state=active]:shadow-lg text-xs uppercase tracking-widest gap-2">
                        <Clock className="h-4 w-4" /> Ajustes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-8 animate-in fade-in duration-500">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Card className="rounded-3xl border-white/5 bg-yellow-500/5 overflow-hidden relative h-20">
                            <div className="absolute top-0 right-0 p-3 opacity-10"><Clock className="h-10 w-10" /></div>
                            <CardHeader className="p-4 space-y-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Pendientes</p>
                                <CardTitle className="text-xl font-black tracking-tight">{stats.pending}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="rounded-3xl border-white/5 bg-blue-500/5 overflow-hidden relative h-20">
                            <div className="absolute top-0 right-0 p-3 opacity-10"><ShoppingBag className="h-10 w-10" /></div>
                            <CardHeader className="p-4 space-y-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Hoy</p>
                                <CardTitle className="text-xl font-black tracking-tight">{stats.today} pedidos</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="rounded-3xl border-white/5 bg-green-500/5 overflow-hidden relative h-20">
                            <div className="absolute top-0 right-0 p-3 opacity-10"><CheckCircle2 className="h-10 w-10" /></div>
                            <CardHeader className="p-4 space-y-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Ventas Hoy</p>
                                <CardTitle className="text-xl font-black tracking-tight">${stats.revenue.toLocaleString()}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <div className="rounded-[2.5rem] border border-white/5 bg-card/50 backdrop-blur-sm shadow-premium overflow-hidden">
                        <div className="border-b border-white/5 bg-white/5 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Package className="h-4 w-4 text-primary" /></div>
                                <h2 className="text-sm font-black tracking-tight uppercase">Pedidos Recientes</h2>
                            </div>
                            <div className="flex items-center gap-1.5 bg-background/50 p-1 rounded-xl border border-white/5 overflow-x-auto max-w-full no-scrollbar">
                                {(['all', 'pending', 'accepted', 'searching_rider', 'assigned', 'shipped', 'completed', 'cancelled'] as const).map(s => (
                                    <Button 
                                        key={s}
                                        variant={statusFilter === s ? 'secondary' : 'ghost'} 
                                        size="sm"
                                        onClick={() => setStatusFilter(s)}
                                        className={cn("rounded-lg h-7 px-2.5 text-[9px] font-black uppercase tracking-widest transition-all shrink-0", statusFilter === s && "shadow-lg bg-white/10")}
                                    >
                                        {s === 'all' ? 'Todos' : statusConfig[s].label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="p-0">
                            <div className="divide-y divide-white/5">
                                {filteredOrders.length === 0 ? (
                                    <div className="py-12 text-center space-y-4 opacity-50">
                                        <Package className="h-10 w-10 mx-auto text-foreground" />
                                        <p className="font-bold uppercase tracking-widest text-[9px]">No hay pedidos registrados</p>
                                    </div>
                                ) : (
                                    filteredOrders.map(order => {
                                        const config = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                                        return (
                                            <div key={order.id} className="p-4 md:p-5 hover:bg-white/[0.02] transition-colors group">
                                                <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">
                                                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                                                        <div className="flex flex-col gap-1 min-w-[120px]">
                                                            <Badge className={cn("px-2 py-0.5 font-black text-[9px] uppercase tracking-widest rounded-lg border w-fit", config.color)}>
                                                                {config.label}
                                                            </Badge>
                                                            <span className="text-[10px] font-bold text-foreground">
                                                                #{order.id.slice(-6).toUpperCase()} • {order.createdAt ? format(order.createdAt.toDate(), "HH:mm", { locale: es }) : 'Ahora'}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black tracking-tight text-sm">{order.userName}</span>
                                                                    <span className="text-[10px] text-foreground font-medium italic lowercase">({order.type})</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-foreground font-medium opacity-60">
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span className="line-clamp-1">{order.deliveryAddress || 'Retiro en local'}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="bg-white/5 rounded-xl p-2 px-3 flex items-center justify-between border border-white/5">
                                                                <div className="flex flex-col">
                                                                    <p className="text-[8px] font-black uppercase text-foreground/50">Monto</p>
                                                                    <p className="text-[12px] font-black text-primary">${order.totalAmount.toLocaleString()}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[8px] font-black uppercase text-foreground/50">Items</p>
                                                                    <p className="text-[10px] font-bold truncate max-w-[120px]">{order.items.length} productos</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 justify-end">
                                                        {order.status === 'pending' ? (
                                                            <div className="flex gap-2">
                                                                <Button 
                                                                    size="sm"
                                                                    onClick={() => handleUpdateStatus(order, 'accepted')}
                                                                    className="rounded-xl font-black uppercase tracking-widest text-[9px] h-9 px-5 bg-primary hover:bg-primary/90 text-white"
                                                                >
                                                                    ACEPTAR
                                                                </Button>
                                                                <Button 
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleUpdateStatus(order, 'cancelled')}
                                                                    className="rounded-xl font-black uppercase tracking-widest text-[9px] h-9 px-4 text-destructive hover:bg-destructive/10 border border-destructive/20"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="rounded-xl font-black uppercase tracking-widest text-[9px] h-9 px-4 border-white/10 hover:bg-white/5">
                                                                        Estado <ChevronDown className="ml-1.5 h-3 w-3" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className="rounded-2xl border-white/5 glass glass-dark w-44">
                                                                    {(['pending', 'accepted', 'searching_rider', 'assigned', 'shipped', 'completed', 'cancelled'] as const).map(s => (
                                                                        <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(order, s)} className="rounded-xl font-bold py-2 text-[10px] uppercase tracking-widest focus:bg-primary/20">
                                                                            {statusConfig[s].label}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                        
                                                        <Button variant="outline" size="icon" className="rounded-xl border-white/10 hover:bg-white/10 h-9 w-9" onClick={() => window.open(`https://wa.me/${order.userPhone?.replace(/\D/g, '')}`, '_blank')}>
                                                            <Phone className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="settings">
                    {(supplierId && supplierData) && (
                        <DeliverySettings supplier={{ ...(supplierData as SupplierProfile), id: supplierId }} />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}


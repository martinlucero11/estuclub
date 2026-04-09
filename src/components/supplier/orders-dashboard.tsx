'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useAdmin } from '@/context/admin-context';
import { collection, query, where, orderBy, limit, doc, updateDoc, serverTimestamp, Timestamp, onSnapshot } from 'firebase/firestore';
import { NewOrderModal } from './new-order-modal';
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
    ChevronDown,
    Bell,
    BellOff
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
    const { user, supplierData: ownSupplierData } = useUser();
    const { impersonatedSupplierData } = useAdmin();
    const { toast } = useToast();
    
    // Core Layout State
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<string>('orders');

    // Notification State
    const [activeAlertOrder, setActiveAlertOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Context Resolution
    const supplierId = propSupplierId || user?.uid;
    const supplierData = propSupplierId && propSupplierId !== user?.uid ? impersonatedSupplierData : ownSupplierData;

    // Data Fetching
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

    // Audio Alert System
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initial audio container setup
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2858/2858-preview.mp3');
            audio.loop = true;
            audioRef.current = audio;
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Recursive Alert Loop Logic
    useEffect(() => {
        if (!audioRef.current || !isAudioEnabled) {
            if (audioRef.current) audioRef.current.pause();
            return;
        }

        const pendingOrdersCount = orders?.filter(o => o.status === 'pending').length || 0;
        
        if (pendingOrdersCount > 0) {
            audioRef.current.play().catch(e => console.error("Audio playback error:", e));
        } else {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    }, [orders, isAudioEnabled]);
    
    // Notification system for new orders while the dashboard is open - HIGH PRIORITY
    useEffect(() => {
        if (!firestore || !supplierId) return;

        // Surgical listener for NEW pending orders only
        const q = query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()),
            where('supplierId', '==', supplierId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                // EXTREMELY IMPORTANT: change.type === 'added' captures exactly when a NEW order lands
                if (change.type === 'added') {
                    const newOrder = change.doc.data();
                    
                    // Prevent triggering on initial load of historical orders (optional but safer)
                    const now = new Date().getTime();
                    const orderTime = newOrder.createdAt instanceof Timestamp ? newOrder.createdAt.toMillis() : now;
                    
                    if (now - orderTime < 60000) { // Only alarm if created in the last 60 seconds
                        haptic.vibrateSuccess();
                        setActiveAlertOrder(newOrder);
                        setIsModalOpen(true);
                        
                        // Force audio loop if enabled
                        if (isAudioEnabled && audioRef.current) {
                            audioRef.current.play().catch(e => {
                                console.warn("Browser blocked auto-play alarm. User engagement required.", e);
                            });
                        }
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [firestore, supplierId, isAudioEnabled]);

    const handleToggleAudio = () => {
        haptic.vibrateSubtle();
        const newState = !isAudioEnabled;
        setIsAudioEnabled(newState);
        
        // Browsers require a user interaction to unlock audio content
        if (newState && audioRef.current) {
            const pendingOrdersCount = orders?.filter(o => o.status === 'pending').length || 0;
            audioRef.current.play()
                .then(() => {
                    if (pendingOrdersCount === 0) {
                        audioRef.current?.pause();
                        audioRef.current!.currentTime = 0;
                    }
                    toast({ title: "Alertas Activas", description: "Sonará un timbre mientras tengas pedidos pendientes." });
                })
                .catch(e => console.error("Initial audio unlock failed:", e));
        } else {
            toast({ title: "Alertas Desactivadas", description: "Ya no recibirás avisos sonoros." });
        }
    };

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

            // MISSION 2: LOGISTICS & ESTIMATION (Corazón de Estuclub)
            if ((newStatus === 'accepted' || newStatus === 'searching_rider') && !order.startTime) {
                const now = new Date();
                const prepTime = supplierData?.avgPrepTime || 30; // 30 min default
                const estTime = new Date(now.getTime() + prepTime * 60000);
                
                updatePayload.startTime = serverTimestamp();
                updatePayload.estimatedDeliveryTime = Timestamp.fromDate(estTime);
            }

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

            // MISSION 6: TRIGGER STATUS NOTIFICATION
            fetch('/api/notifications/notify-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: order.customerId || order.userId,
                    orderId: order.id,
                    status: updatePayload.status,
                    supplierName: supplierData?.name || 'El Local'
                })
            }).catch(e => console.error("Notification trigger error:", e));

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
        if (!orders) return { pending: 0, today: 0, totalSales: 0 };
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return orders.reduce((acc, order) => {
            if (order.status === 'pending') acc.pending++;
            
            const orderDate = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date();
            if (orderDate >= today && order.status !== 'cancelled') {
                acc.today++;
                acc.totalSales += (order.subtotal || order.itemsTotal || 0);
            }
            return acc;
        }, { pending: 0, today: 0, totalSales: 0 });
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
                "rounded-[2.5rem] border border-border transition-all p-6 md:p-8 flex items-center justify-between shadow-xl relative overflow-hidden",
                isClosed ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
            )}>
                <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12">
                   {isClosed ? <XCircle className="h-20 w-20 text-red-500" /> : <CheckCircle2 className="h-20 w-20 text-emerald-500" />}
                </div>
                
                <div className="space-y-1">
                    <h3 className={cn("text-[10px] font-black uppercase tracking-[0.2em]", isClosed ? "text-red-500" : "text-emerald-500")}>
                        {isClosed ? "ESTADO: CERRADO" : "ESTADO: EN LÍNEA"}
                    </h3>
                    <p className="text-[12px] font-bold text-black uppercase tracking-tight opacity-70">
                        {isClosed ? "Tu Club no es visible para los estudiantes." : "Tu Club está recibiendo actividad activa."}
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-background/40 p-2 rounded-3xl border border-border backdrop-blur-md z-10 shadow-sm">
                    <span className={cn("text-[9px] font-black uppercase px-2", isClosed ? "text-black/40" : "text-primary italic animate-pulse")}>
                        {isClosed ? "DESCONECTADO" : "RECIBIENDO"}
                    </span>
                    <Switch 
                        checked={!isClosed} 
                        onCheckedChange={handleTogglePause}
                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleAudio}
                        className={cn(
                            "rounded-2xl h-11 px-6 font-black uppercase tracking-widest text-[10px] gap-2 transition-all active:scale-95 border-2 shadow-sm",
                            isAudioEnabled 
                                ? "bg-primary/5 border-primary/20 text-primary shadow-primary/10" 
                                : "bg-background border-border text-foreground/40"
                        )}
                    >
                        {isAudioEnabled ? <Bell className="h-4 w-4 animate-bounce" /> : <BellOff className="h-4 w-4" />}
                        {isAudioEnabled ? "Alertas Activas" : "Activar Sonido"}
                    </Button>
                </div>
            </Card>

            <Tabs defaultValue="orders" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mx-auto max-w-sm mb-10 h-12 p-1 bg-muted rounded-2xl border border-border">
                    <TabsTrigger value="orders" className="font-black rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xl text-[10px] uppercase tracking-widest gap-2">
                        <Package className="h-3.5 w-3.5" /> Pedidos
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="font-black rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xl text-[10px] uppercase tracking-widest gap-2">
                        <Clock className="h-3.5 w-3.5" /> Ajustes
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-8 animate-in fade-in duration-500">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Card className="rounded-3xl border border-border bg-background overflow-hidden relative h-24 shadow-lg group">
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform"><Clock className="h-12 w-12" /></div>
                            <CardHeader className="p-5 space-y-0 relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pendientes</p>
                                <CardTitle className="text-2xl font-black tracking-tight text-yellow-500 italic">{stats.pending}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="rounded-3xl border border-border bg-background overflow-hidden relative h-24 shadow-lg group">
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform"><ShoppingBag className="h-12 w-12" /></div>
                            <CardHeader className="p-5 space-y-0 relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hoy</p>
                                <CardTitle className="text-2xl font-black tracking-tight text-blue-500 italic">{stats.today} <span className="text-[10px] uppercase font-bold text-muted-foreground/50">pedidos</span></CardTitle>
                            </CardHeader>
                        </Card>
                        <Card className="rounded-3xl border border-border bg-background overflow-hidden relative h-24 shadow-lg group">
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform"><CheckCircle2 className="h-12 w-12" /></div>
                            <CardHeader className="p-5 space-y-0 relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ventas Hoy</p>
                                <CardTitle className="text-2xl font-black tracking-tight text-emerald-500 italic">${stats.totalSales.toLocaleString()}</CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    <div className="rounded-[2.5rem] border border-border bg-background shadow-xl overflow-hidden">
                        <div className="border-b border-border bg-muted/50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center"><Package className="h-4 w-4 text-primary" /></div>
                                <h2 className="text-sm font-black tracking-tight uppercase text-black">Pedidos Recientes</h2>
                            </div>
                            <div className="flex items-center gap-1.5 bg-black/5 p-1 rounded-xl border border-black/5 overflow-x-auto max-w-full no-scrollbar">
                                {(['all', 'pending', 'accepted', 'searching_rider', 'assigned', 'shipped', 'completed', 'cancelled'] as const).map(s => (
                                    <Button 
                                        key={s}
                                        variant={statusFilter === s ? 'secondary' : 'ghost'} 
                                        size="sm"
                                        onClick={() => setStatusFilter(s)}
                                        className={cn("rounded-lg h-7 px-2.5 text-[9px] font-black uppercase tracking-widest transition-all shrink-0", statusFilter === s && "shadow-lg bg-white text-primary")}>
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
                                                                #{order.id.slice(-6).toUpperCase()} • {
                                                                    (order.createdAt && typeof order.createdAt.toDate === 'function') 
                                                                        ? format(order.createdAt.toDate(), "HH:mm", { locale: es }) 
                                                                        : 'Ahora'
                                                                }
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-black tracking-tight text-sm text-black">{order.customerName}</span>
                                                                    <span className="text-[10px] text-black/60 font-medium italic lowercase">({order.type})</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-foreground font-medium opacity-60">
                                                                    <MapPin className="h-3 w-3" />
                                                                    <span className="line-clamp-1">{order.deliveryAddress || 'Retiro en Club'}</span>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="bg-black/5 rounded-xl p-2 px-3 flex items-center justify-between border border-black/5">
                                                                <div className="flex flex-col">
                                                                    <p className="text-[8px] font-black uppercase text-black/40">Venta Local</p>
                                                                    <p className="text-[12px] font-black text-primary">${(order.subtotal || order.itemsTotal || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[8px] font-black uppercase text-black/40">Items</p>
                                                                    <p className="text-[10px] font-bold truncate max-w-[120px] text-black">{order.items?.length || 0} productos</p>
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
                                                                    className="rounded-xl font-black uppercase tracking-widest text-[9px] h-9 px-5 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                                                                >
                                                                    ACEPTAR
                                                                </Button>
                                                                <Button 
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleUpdateStatus(order, 'cancelled')}
                                                                    className="rounded-xl font-black uppercase tracking-widest text-[9px] h-9 px-4 text-red-500 hover:bg-red-50 border border-red-100"
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="rounded-xl font-black uppercase tracking-widest text-[9px] h-9 px-4 border-black/10 hover:bg-black/5 text-black/60">
                                                                        Estado <ChevronDown className="ml-1.5 h-3 w-3" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent className="rounded-2xl border-border bg-background shadow-2xl w-44 p-2">
                                                                    {(['pending', 'accepted', 'searching_rider', 'assigned', 'shipped', 'completed', 'cancelled'] as const).map(s => (
                                                                        <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(order, s)} className="rounded-xl font-black py-2 text-[10px] uppercase tracking-[0.1em] focus:bg-primary/10 focus:text-primary cursor-pointer transition-all">
                                                                            {statusConfig[s].label}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        )}
                                                        
                                                        <Button variant="outline" size="icon" className="rounded-xl border-black/10 hover:bg-black/5 h-9 w-9 text-black/60" onClick={() => window.open(`https://wa.me/${order.customerPhone?.replace(/\D/g, '')}`, '_blank')}>
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
            <NewOrderModal 
                order={activeAlertOrder}
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAccept={(order) => {
                    handleUpdateStatus(order, 'accepted');
                    setIsModalOpen(false);
                }}
                onReject={(order) => {
                    handleUpdateStatus(order, 'cancelled');
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}


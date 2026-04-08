'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Order, SupplierProfile, UserProfile } from '@/types/data';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, 
    Truck, 
    Store, 
    CheckCircle2, 
    Clock, 
    MapPin, 
    Phone, 
    MessageCircle,
    ChevronLeft,
    ShieldCheck,
    Search,
    Bike,
    Car,
    Star,
    User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';

const OrderTrackingMap = dynamic(() => import('@/components/delivery/order-tracking-map').then(mod => mod.OrderTrackingMap), { 
    ssr: false,
    loading: () => null
});

const LOGISTICS_STATUSES = ['searching_rider', 'assigned', 'at_store', 'on_the_way'];

const STATUS_CONFIG = {
    'pending_payment': { label: 'Esperando Pago', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', step: 0 },
    'searching_rider': { label: 'Buscando Rider Estuclub', icon: Search, color: 'text-pink-400', bg: 'bg-pink-400/10', step: 1, pulse: true },
    'accepted': { label: 'Preparando Pedido', icon: Store, color: 'text-pink-400', bg: 'bg-pink-400/10', step: 2 },
    'assigned': { label: 'Rider Asignado', icon: ShieldCheck, color: 'text-pink-400', bg: 'bg-pink-400/10', step: 2 },
    'at_store': { label: 'Rider en el Local', icon: Store, color: 'text-pink-400', bg: 'bg-pink-400/10', step: 3 },
    'on_the_way': { label: 'En camino a tu ubicación', icon: Truck, color: 'text-pink-400', bg: 'bg-pink-400/10', step: 4, pulse: true },
    'delivered': { label: 'Entregado', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10', step: 5 },
    'completed': { label: 'Finalizado', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10', step: 5 },
    'cancelled': { label: 'Cancelado', icon: CheckCircle2, color: 'text-red-400', bg: 'bg-red-400/10', step: -1 },
} as any;

const STEPS = [
    { label: 'Pago', key: 'paid' },
    { label: 'Logística', key: 'searching_rider' },
    { label: 'Preparación', key: 'accepted' },
    { label: 'Viaje', key: 'on_the_way' },
    { label: 'Entrega', key: 'delivered' }
];

export default function OrderTrackingPage() {
    const { id } = useParams();
    const router = useRouter();
    const firestore = useFirestore();
    const [order, setOrder] = useState<Order | null>(null);

    // 1. Real-time Subscription to Order
    useEffect(() => {
        if (!firestore || !id) return;
        const unsub = onSnapshot(doc(firestore, 'orders', id as string), (doc) => {
            if (doc.exists()) {
                setOrder({ id: doc.id, ...doc.data() } as Order);
            }
        });
        return () => unsub();
    }, [firestore, id]);

    // Fetch Supplier and Rider info if present
    const supplierRef = order?.supplierId ? doc(firestore, 'roles_supplier', order.supplierId) : null;
    const { data: supplier } = useDoc<SupplierProfile>(supplierRef);

    const riderRef = order?.riderId ? doc(firestore, 'users', order.riderId) : null;
    const { data: rider } = useDoc<UserProfile>(riderRef);

    if (!order) return (
        <div className="min-h-screen bg-[#000000] flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Clock className="h-10 w-10 text-pink-500/50" />
            </motion.div>
        </div>
    );

    const currentStatus = STATUS_CONFIG[order.status || 'pending_payment'] || STATUS_CONFIG['pending_payment'];
    const Icon = currentStatus.icon;

    const isLogisticsActive = LOGISTICS_STATUSES.includes(order.status);
    const destinationCoords = order.deliveryCoords ? { 
        lat: order.deliveryCoords.latitude, 
        lng: order.deliveryCoords.longitude 
    } : null;

    return (
        <div className="min-h-screen bg-[#000000] text-white pb-24 selection:bg-pink-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#000000]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white/5">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="text-center">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Estado del Pedido</h2>
                    <p className="text-sm font-black italic tracking-tighter">#{id?.toString().slice(-6).toUpperCase()}</p>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">
                
                {/* ── TRACKING MAP SECTION ── */}
                <AnimatePresence mode="wait">
                    {isLogisticsActive && destinationCoords ? (
                        <motion.div 
                            key="map-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="relative h-[550px] w-full -mt-4"
                        >
                            <div className="absolute inset-0 rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
                                <OrderTrackingMap 
                                    orderId={id as string} 
                                    destination={destinationCoords} 
                                />
                            </div>
                            
                            {/* Uber-style Rider Info Overlay */}
                            <div className="absolute inset-x-3 bottom-3 z-30">
                                <Card className="bg-black/40 backdrop-blur-3xl border-white/10 rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
                                     {/* Background Decor */}
                                     <div className="absolute -right-8 -bottom-8 opacity-5">
                                        {rider?.vehicleType === 'auto' ? <Car className="h-32 w-32 rotate-12" /> : <Bike className="h-32 w-32 rotate-12" />}
                                     </div>

                                    <div className="relative z-10 space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="h-16 w-16 rounded-full bg-primary/20 p-1 border-2 border-primary/30 overflow-hidden shadow-2xl">
                                                        {rider?.photoURL ? (
                                                            <img src={rider.photoURL} alt="Rider" className="h-full w-full object-cover rounded-full" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center bg-black/40 rounded-full">
                                                                <UserIcon className="h-6 w-6 text-primary" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Rating Badge */}
                                                    <div className="absolute -bottom-1 -right-1 bg-white text-black text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xl border border-black/10">
                                                        {rider?.avgRating ? rider.avgRating.toFixed(1) : '5.0'} <Star className="h-2 w-2 fill-black" />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Rider Asignado</h4>
                                                    <p className="text-xl font-black tracking-tighter text-white">
                                                        {rider ? `${rider.firstName} ${rider.lastName}` : (order.status === 'searching_rider' ? 'Buscando...' : 'Conectando...')}
                                                    </p>
                                                    {rider?.reviewCount && (
                                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{rider.reviewCount} Viajes Finalizados</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button 
                                                    size="icon" 
                                                    variant="secondary" 
                                                    className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5"
                                                    asChild
                                                >
                                                    <a href={`tel:${rider?.phone || order.riderPhone}`}><Phone className="h-5 w-5" /></a>
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    className="h-12 w-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                                    asChild
                                                >
                                                    <a href={`https://wa.me/${rider?.phone || order.riderPhone}`} target="_blank" rel="noreferrer">
                                                        <MessageCircle className="h-5 w-5" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Vehicle & Status Row */}
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <div className="flex items-center gap-3 mb-1">
                                                    {rider?.vehicleType === 'auto' ? <Car className="h-4 w-4 text-primary" /> : <Bike className="h-4 w-4 text-primary" />}
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Vehículo</span>
                                                </div>
                                                <p className="text-sm font-black italic tracking-tighter uppercase">
                                                    {rider?.vehicleType || 'Moto'} • <span className="text-primary">{rider?.patente || 'S/N'}</span>
                                                </p>
                                            </div>
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Estado</span>
                                                </div>
                                                <p className="text-xs font-black uppercase tracking-widest text-white/80">{currentStatus.label}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="status-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                "relative overflow-hidden rounded-[2.5rem] border border-white/5 p-8 text-center transition-all duration-500",
                                currentStatus.bg
                            )}
                        >
                            <div className="absolute top-0 right-0 p-4">
                                {currentStatus.pulse && (
                                    <span className="relative flex h-4 w-4">
                                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", currentStatus.color.replace('text', 'bg'))}></span>
                                        <span className={cn("relative inline-flex rounded-full h-4 w-4", currentStatus.color.replace('text', 'bg'))}></span>
                                    </span>
                                )}
                            </div>

                            <div className={cn("mx-auto h-24 w-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl transition-all duration-700", currentStatus.bg, "border border-white/10")}>
                                <Icon className={cn("h-12 w-12", currentStatus.color)} />
                            </div>
                            
                            <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                                {currentStatus.label}
                            </h1>
                            <p className="text-[12px] font-black text-foreground uppercase tracking-widest opacity-80">
                                {supplier?.name || order.supplierName}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Progress Tracker */}
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 shadow-inner">
                    <div className="flex justify-between relative">
                        <div className="absolute top-5 left-0 w-full h-[3px] bg-white/5 rounded-full" />
                        <div 
                            className="absolute top-5 left-0 h-[3px] bg-gradient-to-r from-pink-600 to-pink-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                            style={{ width: `${(currentStatus.step / (STEPS.length - 1)) * 100}%` }}
                        />
                        {STEPS.map((step, idx) => {
                            const isPast = idx <= currentStatus.step;
                            return (
                                <div key={step.key} className="relative z-10 flex flex-col items-center gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                        isPast ? "bg-pink-500 border-pink-400 text-black shadow-[0_0_20px_rgba(236,72,153,0.4)]" : "bg-[#000000] border-white/5 text-foreground"
                                    )}>
                                        {isPast ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-current" />}
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.2em] transition-colors",
                                        isPast ? "text-white" : "text-foreground"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* PIN DE SEGURIDAD - TRANSACCIÓN PROTEGIDA */}
                {order.status !== 'delivered' && order.status !== 'completed' && order.deliveryPin && (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-[2.5rem] p-8 border-4 border-black shadow-[0_30px_60px_rgba(0,0,0,0.4)] text-center relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldCheck className="h-20 w-20 text-black rotate-12" />
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">PIN de Seguridad</p>
                            <h2 className="text-6xl font-black italic tracking-tighter text-black tabular-nums">
                                {order.deliveryPin}
                            </h2>
                            <p className="text-[9px] font-black text-black/60 uppercase tracking-widest pt-2">
                                Dale este código al Rider para confirmar la recepción
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Details Section */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl">
                    <div className="space-y-6">
                        <div className="flex items-start gap-6 group">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-pink-500/10 group-hover:border-pink-500/20 transition-all">
                                <MapPin className="h-6 w-6 text-foreground group-hover:text-pink-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground mb-1">Dirección de Entrega</h4>
                                <p className="text-base font-black tracking-tight">{order.deliveryAddress}</p>
                                {order.deliveryNote && <p className="text-[11px] text-foreground mt-2 italic bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">"{order.deliveryNote}"</p>}
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="flex items-start gap-6 group">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-pink-500/10 group-hover:border-pink-500/20 transition-all">
                                <Store className="h-6 w-6 text-foreground group-hover:text-pink-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground mb-1">Comercio</h4>
                                <p className="text-base font-black tracking-tight">{supplier?.name || order.supplierName}</p>
                                <p className="text-[11px] text-foreground italic">{supplier?.location?.address || 'Estuclub Official Point'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-white/[0.03] to-transparent rounded-[2.5rem] p-8 space-y-4 border border-white/5 shadow-inner">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground mb-4 flex items-center gap-2">
                            <Package className="h-3 w-3" /> Detalle
                        </h4>
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-bold tracking-tight">
                                <span className="text-foreground">{item.quantity}x {item.name}</span>
                                <span className="text-white">$ {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        <Separator className="bg-white/10 my-4" />
                        <div className="flex justify-between text-lg font-black italic uppercase tracking-tighter">
                            <span className="text-pink-500">Monto Final</span>
                            <span className="text-white">$ {order.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="space-y-3 pt-4">
                    <Button 
                        onClick={() => router.push('/delivery')}
                        className="w-full h-16 rounded-[1.5rem] bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-background transition-all shadow-2xl"
                    >
                        Volver a la Tienda
                    </Button>
                </div>
            </main>
        </div>
    );
}

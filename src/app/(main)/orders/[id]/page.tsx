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
    Bike
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG = {
    'pending_payment': { label: 'Esperando Pago', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', step: 0 },
    'searching_rider': { label: 'Buscando Rider Estuclub', icon: Search, color: 'text-cyan-400', bg: 'bg-cyan-400/10', step: 1, pulse: true },
    'accepted': { label: 'Preparando Pedido', icon: Store, color: 'text-pink-400', bg: 'bg-pink-400/10', step: 2 },
    'assigned': { label: 'Rider Asignado', icon: ShieldCheck, color: 'text-cyan-400', bg: 'bg-cyan-400/10', step: 2 },
    'at_store': { label: 'Rider en el Local', icon: Store, color: 'text-cyan-400', bg: 'bg-cyan-400/10', step: 3 },
    'on_the_way': { label: 'En camino a tu ubicación', icon: Truck, color: 'text-cyan-400', bg: 'bg-cyan-400/10', step: 4, pulse: true },
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
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Clock className="h-10 w-10 text-pink-500/50" />
            </motion.div>
        </div>
    );

    const currentStatus = STATUS_CONFIG[order.status || 'pending_payment'] || STATUS_CONFIG['pending_payment'];
    const Icon = currentStatus.icon;

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-24 selection:bg-pink-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-white/5">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="text-center">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Estado del Pedido</h2>
                    <p className="text-sm font-black italic tracking-tighter">#{id?.toString().slice(-6).toUpperCase()}</p>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">
                {/* Status Hero Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                    <p className="text-[12px] font-black text-slate-200 uppercase tracking-widest opacity-80">
                        {supplier?.name || order.supplierName}
                    </p>
                </motion.div>

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
                            const isCurrent = idx === currentStatus.step;
                            return (
                                <div key={step.key} className="relative z-10 flex flex-col items-center gap-3">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                        isPast ? "bg-pink-500 border-pink-400 text-black shadow-[0_0_20px_rgba(236,72,153,0.4)]" : "bg-[#050505] border-white/5 text-slate-700"
                                    )}>
                                        {isPast ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-2 w-2 rounded-full bg-current" />}
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-[0.2em] transition-colors",
                                        isPast ? "text-white" : "text-slate-700"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rider Info Card - High Visibility */}
                <AnimatePresence>
                    {(order.riderId || order.status === 'searching_rider') && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-cyan-400/5 border border-cyan-400/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group shadow-[0_20px_40px_rgba(6,182,212,0.05)]"
                        >
                            <div className="absolute -top-12 -right-12 h-32 w-32 bg-cyan-400/10 rounded-full blur-3xl group-hover:bg-cyan-400/20 transition-all duration-1000" />
                            
                            <div className="flex items-center gap-6 relative z-10">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20 group-hover:border-cyan-400/40 transition-colors">
                                    <Truck className={cn("h-8 w-8 text-cyan-400", order.status === 'searching_rider' && "animate-bounce")} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-cyan-400/80">Logística Estuclub</h3>
                                    <p className="text-lg font-black tracking-tight leading-none">
                                        {rider ? `${rider.firstName} ${rider.lastName}` : (order.status === 'searching_rider' ? 'Buscando Repartidor...' : 'Asignando Rider...')}
                                    </p>
                                    {order.status === 'searching_rider' && (
                                        <p className="text-[10px] font-bold text-slate-400 italic">Un Rider oficial tomará tu pedido en unos segundos.</p>
                                    )}
                                </div>
                            </div>

                            {rider?.phone && (
                                <div className="flex gap-3 pt-2 relative z-10">
                                    <Button size="lg" className="flex-1 rounded-2xl bg-[#0a0a0a] border border-white/5 font-black uppercase tracking-widest text-[10px] h-12 shadow-xl hover:bg-white/5" asChild>
                                        <a href={`tel:${rider.phone}`} className="flex items-center justify-center gap-2">
                                            <Phone className="h-3 w-3 text-cyan-400" />
                                            Llamar Rider
                                        </a>
                                    </Button>
                                    <Button size="lg" className="flex-1 rounded-2xl bg-green-500/10 border border-green-500/20 font-black uppercase tracking-widest text-[10px] h-12 shadow-xl hover:bg-green-500/20 text-green-400" asChild>
                                        <a href={`https://wa.me/${rider.phone}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                                            <MessageCircle className="h-3 w-3" />
                                            WhatsApp
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Details Section */}
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 shadow-2xl">
                    <div className="space-y-6">
                        <div className="flex items-start gap-6 group">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-pink-500/10 group-hover:border-pink-500/20 transition-all">
                                <MapPin className="h-6 w-6 text-slate-400 group-hover:text-pink-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Dirección de Entrega</h4>
                                <p className="text-base font-black tracking-tight">{order.deliveryAddress}</p>
                                {order.deliveryNote && <p className="text-[11px] text-slate-400 mt-2 italic bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">"{order.deliveryNote}"</p>}
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="flex items-start gap-6 group">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-pink-500/10 group-hover:border-pink-500/20 transition-all">
                                <Store className="h-6 w-6 text-slate-400 group-hover:text-pink-500 transition-colors" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Comercio</h4>
                                <p className="text-base font-black tracking-tight">{supplier?.name || order.supplierName}</p>
                                <p className="text-[11px] text-slate-400 italic">{supplier?.location?.address || 'Estuclub Official Point'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-white/[0.03] to-transparent rounded-[2.5rem] p-8 space-y-4 border border-white/5 shadow-inner">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center gap-2">
                            <Package className="h-3 w-3" /> Detalle
                        </h4>
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-bold tracking-tight">
                                <span className="text-slate-300">{item.quantity}x {item.name}</span>
                                <span className="text-white">$ {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        <Separator className="bg-white/10 my-4" />
                        <div className="flex justify-between text-lg font-black italic uppercase tracking-tighter">
                            <span className="text-pink-500">Monto Final</span>
                            <span className="text-white">$ {order.totalAmount.toLocaleString()}</span>
                        </div>
                        <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest pt-2">Pago Verificado • Estuclub Secure Express</p>
                    </div>

                    {/* DOOR PAYMENT REMINDER */}
                    {order.type === 'delivery' && order.deliveryPaymentStatus === 'pending' && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            className="bg-[#d93b64] p-6 rounded-[2.5rem] border-4 border-black shadow-[0_20px_40px_rgba(217,59,100,0.3)] text-center space-y-2"
                        >
                            <div className="flex justify-center gap-2">
                                <Bike className="h-6 w-6 text-black" />
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-black">Abonar Repartidor</h3>
                            </div>
                            <p className="text-sm font-black text-white uppercase tracking-widest">
                                Tené listos <span className="text-2xl text-black ml-1">$ {order.deliveryFee?.toLocaleString() || order.deliveryCost?.toLocaleString()}</span>
                            </p>
                            <p className="text-[10px] font-bold text-black/60 uppercase tracking-tighter">Costo del envío a pagar en mano al recibir</p>
                        </motion.div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="space-y-3 pt-4">
                    <Button 
                        onClick={() => router.push('/delivery')}
                        className="w-full h-16 rounded-[1.5rem] bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all shadow-2xl"
                    >
                        Volver a la Tienda
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => router.push('/orders')}
                        className="w-full h-14 rounded-[1.5rem] bg-white/5 border border-white/5 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-white"
                    >
                        Ver todos mis pedidos
                    </Button>
                </div>
            </main>

            {/* Success Celebration */}
            {order.status === 'delivered' && (
                <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100] bg-black/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-green-500 text-black font-black italic uppercase tracking-tighter px-14 py-8 rounded-[2.5rem] shadow-[0_0_100px_rgba(34,197,94,0.6)] flex flex-col items-center gap-2 border-4 border-black"
                    >
                        <CheckCircle2 className="h-12 w-12" />
                        <span className="text-4xl">¡Entregado!</span>
                        <span className="text-xs tracking-widest">Disfruta tu pedido ✨</span>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

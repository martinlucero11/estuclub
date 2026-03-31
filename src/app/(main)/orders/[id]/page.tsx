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
    Search
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
                            <span className="relative flex h-3 w-3">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", currentStatus.color.replace('text', 'bg'))}></span>
                                <span className={cn("relative inline-flex rounded-full h-3 w-3", currentStatus.color.replace('text', 'bg'))}></span>
                            </span>
                        )}
                    </div>

                    <div className={cn("mx-auto h-20 w-20 rounded-3xl flex items-center justify-center mb-4 transition-all duration-700", currentStatus.bg)}>
                        <Icon className={cn("h-10 w-10", currentStatus.color)} />
                    </div>
                    
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-1">
                        {currentStatus.label}
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {supplier?.name || order.supplierName}
                    </p>
                </motion.div>

                {/* Progress Tracker */}
                <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6">
                    <div className="flex justify-between relative">
                        <div className="absolute top-4 left-0 w-full h-[2px] bg-white/10" />
                        <div 
                            className="absolute top-4 left-0 h-[2px] bg-pink-500 transition-all duration-1000"
                            style={{ width: `${(currentStatus.step / (STEPS.length - 1)) * 100}%` }}
                        />
                        {STEPS.map((step, idx) => {
                            const isPast = idx <= currentStatus.step;
                            const isCurrent = idx === currentStatus.step;
                            return (
                                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                                        isPast ? "bg-pink-500 border-pink-500 text-black shadow-[0_0_15px_rgba(236,72,153,0.5)]" : "bg-[#050505] border-white/10 text-slate-600"
                                    )}>
                                        {isPast ? <CheckCircle2 className="h-4 w-4" /> : <div className="h-1.5 w-1.5 rounded-full bg-current" />}
                                    </div>
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-widest transition-colors",
                                        isPast ? "text-white" : "text-slate-600"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rider Info (Conditional) */}
                <AnimatePresence>
                    {(order.riderId || order.status === 'searching_rider') && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-cyan-500/10 border border-cyan-500/20 rounded-[2.5rem] p-6 space-y-4 shadow-[0_10px_30px_rgba(6,182,212,0.1)]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                                    <Truck className="h-6 w-6 text-cyan-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Logística Estuclub</h3>
                                    <p className="font-bold">
                                        {rider ? `${rider.firstName} ${rider.lastName}` : (order.status === 'searching_rider' ? 'Buscando repartidor...' : 'Asignando Rider...')}
                                    </p>
                                </div>
                                {rider?.phone && (
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" className="rounded-xl bg-white/5 border border-white/10" asChild>
                                            <a href={`tel:${rider.phone}`}><Phone className="h-4 w-4 text-cyan-400" /></a>
                                        </Button>
                                        <Button size="icon" variant="ghost" className="rounded-xl bg-white/5 border border-white/10" asChild>
                                            <a href={`https://wa.me/${rider.phone}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 text-green-400" /></a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Details Section */}
                <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                                <MapPin className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Dirección de Entrega</h4>
                                <p className="text-sm font-bold">{order.deliveryAddress}</p>
                                {order.deliveryNote && <p className="text-[10px] text-slate-400 mt-1 italic">"{order.deliveryNote}"</p>}
                            </div>
                        </div>

                        <Separator className="bg-white/5" />

                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <Store className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Origen</h4>
                                <p className="text-sm font-bold">{supplier?.name || order.supplierName}</p>
                                <p className="text-[10px] text-slate-400">{supplier?.location?.address || 'Retiro en local'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-3xl p-6 space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resumen</h4>
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs font-bold">
                                <span className="text-slate-400">{item.quantity}x {item.name}</span>
                                <span>$ {(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                        ))}
                        <Separator className="bg-white/5 my-2" />
                        <div className="flex justify-between text-sm font-black italic uppercase tracking-tighter">
                            <span className="text-pink-500">Total Pagado</span>
                            <span>$ {order.totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Floating Help Button */}
                <Button variant="ghost" className="w-full h-14 rounded-2xl border border-white/5 bg-white/5 font-bold uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-all">
                    ¿Necesitas ayuda con tu pedido?
                </Button>
            </main>

            {/* Success Celebration (Confetti simulation with design) */}
            {order.status === 'delivered' && (
                <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100]">
                    <motion.div 
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-green-500 text-black font-black italic uppercase tracking-tighter px-12 py-6 rounded-full shadow-[0_0_100px_rgba(34,197,94,0.5)]"
                    >
                        ¡Entregado! ✨
                    </motion.div>
                </div>
            )}
        </div>
    );
}

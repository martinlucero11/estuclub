'use client';

import React from 'react';
import Link from 'next/link';
import { useOrderTracking } from '@/hooks/use-order-tracking';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bike, 
    ChevronRight, 
    Navigation, 
    Clock, 
    Box, 
    CheckCircle2,
    MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ActiveOrderBanner() {
    const { activeOrder, loading } = useOrderTracking();

    if (loading || !activeOrder) return null;

    // Define status-specific configuration
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending_payment':
                return {
                    label: 'Esperando Pago',
                    sub: 'Toca para finalizar la transacción',
                    icon: Clock,
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-500/20'
                };
            case 'searching_rider':
                return {
                    label: 'Buscando tu Rider',
                    sub: 'Estamos asignando un repartidor oficial',
                    icon: Navigation,
                    color: 'text-primary',
                    bg: 'bg-primary/5',
                    border: 'border-primary/20',
                    animate: true
                };
            case 'assigned':
            case 'at_store':
                return {
                    label: 'Rider en camino al local',
                    sub: 'Tu pedido se está preparando',
                    icon: Box,
                    color: 'text-primary',
                    bg: 'bg-primary/5',
                    border: 'border-primary/20'
                };
            case 'on_the_way':
            case 'shipped':
                return {
                    label: '¡Pedido en camino!',
                    sub: 'Toca para ver el mapa en vivo',
                    icon: Bike,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    animate: true
                };
            case 'arrived':
                return {
                    label: '¡Rider en tu puerta!',
                    sub: 'Sal a recibir tu pedido Estuclub',
                    icon: MapPin,
                    color: 'text-emerald-500',
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-500/20',
                    animate: true
                };
            case 'delivered':
                return {
                    label: '¡Pedido Entregado!',
                    sub: 'Gracias por confiar en Estuclub',
                    icon: CheckCircle2,
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/20'
                };
            default:
                return {
                    label: 'Tu pedido está activo',
                    sub: 'Toca para ver los detalles',
                    icon: Bike,
                    color: 'text-primary',
                    bg: 'bg-primary/5',
                    border: 'border-primary/20'
                };
        }
    };

    const config = getStatusConfig(activeOrder.status);
    const StatusIcon = config.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="w-full mb-6"
            >
                <Link href={`/orders/${activeOrder.id}`}>
                    <div className={cn(
                        "relative overflow-hidden rounded-[2.5rem] p-5 flex items-center justify-between transition-all active:scale-[0.98] border shadow-lg group",
                        config.bg,
                        config.border
                    )}>
                        {/* Status Pulse Decoration */}
                        {config.animate && (
                            <div className="absolute top-0 right-0 p-4">
                                <span className="relative flex h-3 w-3">
                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", config.color.replace('text', 'bg'))}></span>
                                    <span className={cn("relative inline-flex rounded-full h-3 w-3", config.color.replace('text', 'bg'))}></span>
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                                config.bg,
                                "border border-white/10"
                            )}>
                                <StatusIcon className={cn("h-7 w-7", config.color, config.animate && status === 'on_the_way' && "animate-bounce")} />
                            </div>

                            <div className="flex flex-col">
                                <h3 className={cn("text-lg font-black italic uppercase tracking-tighter leading-none mb-1", config.color)}>
                                    {config.label}
                                </h3>
                                <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest flex items-center gap-2">
                                    {config.sub}
                                    {config.animate && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                </p>
                            </div>
                        </div>

                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 transition-colors group-hover:bg-white/10">
                            <ChevronRight className="h-5 w-5 text-foreground/40" />
                        </div>

                        {/* Animated Mesh Pattern Background */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                    </div>
                </Link>
            </motion.div>
        </AnimatePresence>
    );
}


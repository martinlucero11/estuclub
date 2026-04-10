'use client';

import React, { useMemo } from 'react';
import { Order } from '@/types/data';
import { 
    Clock, 
    MapPin, 
    ChevronRight, 
    Calendar,
    Package,
    Navigation,
    CheckCircle2,
    DollarSign,
    Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RiderHistoryProps {
    orders: Order[];
}

export function RiderHistory({ orders }: RiderHistoryProps) {
    const groupedOrders = useMemo(() => {
        const groups: Record<string, Order[]> = {};
        
        orders.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return dateB - dateA;
        }).forEach(order => {
            const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
            const key = format(date, "EEEE, d 'de' MMMM", { locale: es });
            if (!groups[key]) groups[key] = [];
            groups[key].push(order);
        });
        
        return Object.entries(groups);
    }, [orders]);

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 animate-in fade-in duration-700">
                <div className="h-32 w-32 rounded-[4rem] bg-zinc-100 border-2 border-dashed border-zinc-200 flex items-center justify-center">
                    <Clock className="h-12 w-12 text-zinc-300" />
                </div>
                <div className="space-y-2">
                    <p className="text-lg font-black italic tracking-tighter uppercase text-zinc-400">Bitácora Vacía</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">Tu leyenda comienza con el primer viaje</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="space-y-2 px-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-2 w-2 rounded-full bg-[#cb465a]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#cb465a]">Historial de Despliegue</span>
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase text-zinc-900 font-montserrat">Cronología</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Registro Maestro de Operaciones Finalizadas</p>
            </header>

            <div className="space-y-12">
                {groupedOrders.map(([date, dayOrders]) => (
                    <div key={date} className="relative pl-6 space-y-6">
                        {/* Timeline vertical line */}
                        <div className="absolute left-0 top-2 bottom-0 w-px bg-gradient-to-b from-[#cb465a] via-zinc-200 to-transparent" />
                        
                        <div className="sticky top-0 z-10 -ml-[25px] flex items-center gap-4 py-2">
                            <div className="h-12 w-12 rounded-2xl bg-white border-2 border-[#cb465a] flex items-center justify-center shadow-lg">
                                <Calendar className="h-5 w-5 text-[#cb465a]" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-900 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-100 shadow-xl">
                                {date}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {dayOrders.map((order) => (
                            <Card key={order.id} className="bg-white border-zinc-200 rounded-[2.5rem] overflow-hidden group active:scale-[0.98] transition-all hover:bg-zinc-50 shadow-xl">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-14 rounded-2xl bg-[#cb465a]/10 flex items-center justify-center border border-[#cb465a]/20">
                                                    <Package className="h-6 w-6 text-[#cb465a]" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-lg font-black italic uppercase tracking-tighter text-zinc-900">{order.supplierName}</p>
                                                        <Badge className="bg-zinc-100 text-zinc-400 border-0 text-[8px] font-black uppercase font-mono tracking-tighter">
                                                            ID: {order.id.slice(-6).toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-zinc-400" />
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                                                            {order.createdAt?.toDate ? format(order.createdAt.toDate(), "HH:mm 'hs'", { locale: es }) : '00:00 hs'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase text-[#cb465a]/60 tracking-widest mb-1">Ganancia</p>
                                                <p className="text-2xl font-black italic tracking-tighter text-[#cb465a]">
                                                    +${(order.deliveryCost || order.deliveryFee || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-50 rounded-3xl p-4 border border-zinc-100 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3 w-3 text-emerald-600" />
                                                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.2em]">Destino</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-zinc-600 truncate uppercase">{order.deliveryAddress}</p>
                                            </div>
                                            <div className="bg-zinc-50 rounded-3xl p-4 border border-zinc-100 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Zap className="h-3 w-3 text-yellow-500" />
                                                        <span className="text-[8px] font-black uppercase text-zinc-400 tracking-[0.2em]">Estado</span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Entregado</p>
                                                </div>
                                                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

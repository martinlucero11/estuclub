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
    CheckCircle2
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
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="h-20 w-20 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center">
                    <Clock className="h-10 w-10 text-white/20" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest text-white/60">Sin Historial</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">Aún no has completado viajes</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-32">
            <header className="space-y-1 px-2">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white font-montserrat">Historial</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Registro Maestro de Entregas</p>
            </header>

            {groupedOrders.map(([date, dayOrders]) => (
                <div key={date} className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#cb465a]">{date}</span>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>

                    <div className="space-y-3">
                        {dayOrders.map((order) => (
                            <Card key={order.id} className="bg-white/[0.02] border-white/5 rounded-[2rem] overflow-hidden group active:scale-[0.98] transition-all">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-[#cb465a]/10 flex items-center justify-center border border-[#cb465a]/10">
                                            <Package className="h-5 w-5 text-[#cb465a]" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black italic uppercase tracking-tight text-white">{order.supplierName}</p>
                                                <Badge variant="outline" className="text-[7px] h-4 border-[#cb465a]/30 text-[#cb465a] font-black uppercase">
                                                    #{order.id.slice(-4)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-white/40">
                                                <MapPin className="h-3 w-3" />
                                                <p className="text-[9px] font-bold uppercase truncate max-w-[150px]">{order.deliveryAddress}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-black tracking-tighter text-[#cb465a] font-inter">
                                            +${(order.deliveryCost || order.deliveryFee || 0).toLocaleString()}
                                        </p>
                                        <div className="flex items-center justify-end gap-1 text-emerald-400">
                                            <CheckCircle2 className="h-2.5 w-2.5" />
                                            <span className="text-[8px] font-black uppercase">Éxito</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

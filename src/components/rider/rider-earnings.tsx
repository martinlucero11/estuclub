'use client';

import React, { useMemo, useState } from 'react';
import { Order } from '@/types/data';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import { 
    Wallet, 
    TrendingUp, 
    ArrowUpRight, 
    Package, 
    Calendar,
    ChevronLeft,
    ChevronRight,
    TrendingDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';

interface RiderEarningsProps {
    orders: Order[];
}

type TimeRange = '1d' | '7d' | '15d' | 'month';

export function RiderEarnings({ orders }: RiderEarningsProps) {
    const [range, setRange] = useState<TimeRange>('7d');

    const completedOrders = useMemo(() => 
        orders.filter(o => ['delivered', 'completed'].includes(o.status)),
    [orders]);

    const totalBalance = useMemo(() => 
        completedOrders.reduce((sum, o) => sum + (o.deliveryCost || o.deliveryFee || 0), 0),
    [completedOrders]);

    // Simple aggregation by day/week/month
    const chartData = useMemo(() => {
        const data: Record<string, number> = {};
        const now = new Date();
        
        // Fill based on range
        let daysToLookBack = 7;
        if (range === '1d') daysToLookBack = 1;
        if (range === '15d') daysToLookBack = 15;
        if (range === 'month') daysToLookBack = 30;

        for (let i = daysToLookBack - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const key = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
            data[key] = 0;
        }

        completedOrders.forEach(order => {
            const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
            const key = date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
            if (data[key] !== undefined) {
                data[key] += (order.deliveryCost || order.deliveryFee || 0);
            }
        });

        return Object.entries(data).map(([name, total]) => ({ name, total }));
    }, [completedOrders, range]);

    const stats = [
        { label: 'Entregas', value: completedOrders.length, icon: Package, color: 'text-[#cb465a]' },
        { label: 'Ingreso Prom.', value: completedOrders.length ? Math.round(totalBalance / completedOrders.length) : 0, icon: TrendingUp, color: 'text-emerald-500' },
        { label: 'Meta Diaria', value: '80%', icon: ArrowUpRight, color: 'text-orange-500' },
    ];

    return (
        <div className="space-y-8 pb-32">
            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-[#cb465a] to-[#8a2f3d] border-0 rounded-[2.5rem] p-8 shadow-[0_20px_40px_rgba(203,70,90,0.3)] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <Wallet className="h-32 w-32 text-black" />
                </div>
                <div className="relative z-10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Saldo Disponible</p>
                    <h2 className="text-5xl font-black italic tracking-tighter text-white font-montserrat">
                        ${totalBalance.toLocaleString()}
                    </h2>
                    <div className="flex gap-2">
                        <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-emerald-300" />
                            <span className="text-[10px] font-black text-white">+12% vs ayer</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Range Selector */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                {(['1d', '7d', '15d', 'month'] as const).map((r) => (
                    <button
                        key={r}
                        onClick={() => {
                            haptic.vibrateSubtle();
                            setRange(r);
                        }}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                            range === r ? "bg-[#cb465a] text-white shadow-lg" : "text-foreground/40 hover:text-white"
                        )}
                    >
                        {r === '1d' ? 'Hoy' : r === '7d' ? '7 días' : r === '15d' ? '15 días' : 'Mes'}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-6">
                <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] italic">Análisis Visor</CardTitle>
                        <p className="text-[10px] text-foreground/40 font-bold uppercase">Distribución de ingresos por período</p>
                    </div>
                    <Calendar className="h-4 w-4 text-[#cb465a]" />
                </CardHeader>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#ffffff20" 
                                fontSize={8} 
                                fontWeight={900}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.4)' }}
                            />
                            <YAxis 
                                stroke="#ffffff20" 
                                fontSize={8} 
                                fontWeight={900}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `$${val}`}
                                tick={{ fill: 'rgba(255,255,255,0.4)' }}
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(203,70,90,0.05)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-black/90 backdrop-blur-xl border border-[#cb465a]/30 p-3 rounded-xl shadow-2xl">
                                                <p className="text-[10px] font-black uppercase text-white/40 mb-1">{payload[0].payload.name}</p>
                                                <p className="text-sm font-black text-[#cb465a]">${payload[0].value?.toLocaleString()}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.total > 0 ? '#cb465a' : 'rgba(255,255,255,0.05)'} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i} className="bg-white/[0.02] border-white/5 rounded-3xl p-4">
                            <Icon className={cn("h-4 w-4 mb-3", stat.color)} />
                            <div className="space-y-1">
                                <p className="text-lg font-black tracking-tighter italic">{stat.value.toLocaleString()}</p>
                                <p className="text-[8px] font-black uppercase tracking-widest text-foreground/40">{stat.label}</p>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

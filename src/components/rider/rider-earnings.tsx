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
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { 
    Wallet, 
    TrendingUp, 
    ArrowUpRight, 
    Package, 
    Calendar,
    ChevronLeft,
    ChevronRight,
    TrendingDown,
    Zap,
    Trophy,
    Target
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
        { label: 'Entregas', value: completedOrders.length, icon: Package, color: 'text-[#cb465a]', bg: 'bg-[#cb465a]/10' },
        { label: 'Ingreso Prom.', value: completedOrders.length ? Math.round(totalBalance / completedOrders.length) : 0, icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
        { label: 'Efectividad', value: '98%', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    ];

    return (
        <div className="space-y-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Balance Viewport (Premium Glass) */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#cb465a] to-[#8a2f3d] rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative bg-black/40 backdrop-blur-3xl border-white/10 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
                    {/* Background Visuals */}
                    <div className="absolute -right-10 -top-10 opacity-[0.03] scale-150 rotate-12">
                        <Wallet className="h-64 w-64 text-white" />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Saldo Acumulado</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-black text-[#cb465a] italic">$</span>
                                    <h2 className="text-6xl font-black italic tracking-tighter text-white font-montserrat tabular-nums">
                                        {totalBalance.toLocaleString()}
                                    </h2>
                                </div>
                            </div>
                            <div className="bg-[#cb465a] p-4 rounded-3xl shadow-[0_10px_30px_rgba(203,70,90,0.3)] border border-white/10">
                                <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase text-foreground/40 tracking-widest text-left">Tendencia</p>
                                    <p className="text-sm font-black text-emerald-400">+12.4%</p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase text-foreground/40 tracking-widest text-left">Maestro Pro</p>
                                    <p className="text-sm font-black text-white/80">NIVEL 4</p>
                                </div>
                                <Trophy className="h-4 w-4 text-yellow-500" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Premium Selector */}
            <div className="flex bg-white/[0.03] p-1.5 rounded-[1.8rem] border border-white/5 backdrop-blur-xl">
                {(['1d', '7d', '15d', 'month'] as const).map((r) => (
                    <button
                        key={r}
                        onClick={() => {
                            haptic.vibrateSubtle();
                            setRange(r);
                        }}
                        className={cn(
                            "flex-1 py-4 text-[9px] font-black uppercase tracking-[0.2em] rounded-[1.2rem] transition-all duration-300",
                            range === r 
                                ? "bg-white text-black shadow-xl" 
                                : "text-foreground/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {r === '1d' ? 'Hoy' : r === '7d' ? '7 Días' : r === '15d' ? '15 Días' : 'Mes'}
                    </button>
                ))}
            </div>

            {/* High-Fidelity Chart Area */}
            <Card className="bg-[#111111]/80 backdrop-blur-xl border-white/5 rounded-[2.5rem] p-8 shadow-inner overflow-hidden relative">
                <CardHeader className="p-0 mb-10 flex flex-row items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.3em] italic text-white">Análisis Visor de Ganancias</CardTitle>
                        <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">Rendimiento por Período Detallado</p>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                        <Calendar className="h-4 w-4 text-[#cb465a]" />
                    </div>
                </CardHeader>

                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#cb465a" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#cb465a" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                stroke="#ffffff20" 
                                fontSize={8} 
                                fontWeight={900}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'rgba(255,255,255,0.4)', dy: 10 }}
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
                                cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 10 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-black/90 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl ring-1 ring-white/10">
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">{payload[0].payload.name}</p>
                                                <p className="text-xl font-black text-[#cb465a] italic">${payload[0].value?.toLocaleString()}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar 
                                dataKey="total" 
                                radius={[10, 10, 10, 10]} 
                                barSize={range === 'month' ? 8 : 24}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.total > 0 ? "url(#barGradient)" : "rgba(255,255,255,0.05)"} 
                                        className="transition-all duration-500 hover:opacity-80"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Stats Grid (Prestige Cards) */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={i} className="bg-[#111111]/80 backdrop-blur-xl border-white/5 rounded-[2rem] p-5 hover:bg-white/[0.05] transition-all group">
                            <div className={cn("h-10 w-10 mb-4 rounded-2xl flex items-center justify-center border border-white/5 transition-colors", stat.bg)}>
                                <Icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xl font-black tracking-tighter italic text-white group-hover:text-[#cb465a] transition-colors">{stat.value.toLocaleString()}</p>
                                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-foreground/30">{stat.label}</p>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

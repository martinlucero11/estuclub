'use client';

import React, { useMemo, useState } from 'react';
import { useCollectionOnce, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import { Order, Product } from '@/types/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FunnelChart, Funnel, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { subDays, startOfDay, startOfMonth, isAfter } from 'date-fns';
import { Download, Filter, Target, Users } from 'lucide-react';
import { generateCSV } from '@/lib/export-utils';

export default function GlobalAnalyticsDashboard() {
    const firestore = useFirestore();
    const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month'>('month');

    const { data: allOrders, isLoading: ordersLoading } = useCollectionOnce<Order>(
        query(collection(firestore, 'orders').withConverter(createConverter<Order>()), orderBy('createdAt', 'desc'))
    );

    const { data: allProducts, isLoading: productsLoading } = useCollectionOnce<Product>(
        query(collection(firestore, 'products').withConverter(createConverter<Product>()))
    );

    // Fetch checkout_initiated events
    const { data: allEvents, isLoading: eventsLoading } = useCollectionOnce<any>(
        query(collection(firestore, 'analytics_events'), orderBy('timestamp', 'desc'))
    );

    const stats = useMemo(() => {
        if (!allOrders || !allProducts || !allEvents) return null;

        const now = new Date();
        let startDate: Date;

        if (dateFilter === 'today') {
            startDate = startOfDay(now);
        } else if (dateFilter === '7days') {
            startDate = subDays(now, 7);
        } else {
            startDate = startOfMonth(now);
        }

        // 1. Funnel Calculation (Visitas -> Intención de Pago -> Pagos Exitosos)
        
        // Sum of all product views
        const totalVisits = allProducts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
        
        // Count checkout_initiated within timeframe
        const checkoutsInitiated = allEvents.filter(e => e.eventType === 'checkout_initiated' && e.timestamp && isAfter(e.timestamp.toDate(), startDate)).length;

        // Count successful orders within timeframe
        const successfulOrders = allOrders.filter(o => 
            o.createdAt && isAfter(o.createdAt.toDate(), startDate) && 
            ['delivered', 'completed', 'searching_rider', 'accepted', 'pending_payment'].includes(o.status)
        );
        const successfulCount = successfulOrders.length;

        const funnelData = [
            { name: 'Visitas (Catálogo)', value: totalVisits > 0 ? totalVisits : 1, fill: 'hsl(var(--primary))' },
            { name: 'Carritos a Checkout', value: checkoutsInitiated, fill: '#f59e0b' },
            { name: 'Pagos Exitosos', value: successfulCount, fill: '#000000' }
        ];

        // 2. Retention Rate (Usuarios que compran más de 1 vez en este periodo)
        const ordersByUser = successfulOrders.reduce((acc, o) => {
            acc[o.userId] = (acc[o.userId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalShoppers = Object.keys(ordersByUser).length;
        const repeatShoppers = Object.values(ordersByUser).filter(count => count > 1).length;
        const retentionRate = totalShoppers > 0 ? (repeatShoppers / totalShoppers) * 100 : 0;

        return {
            funnelData,
            retentionRate,
            totalShoppers,
            successfulOrders
        };
    }, [allOrders, allProducts, allEvents, dateFilter]);

    if (ordersLoading || productsLoading || eventsLoading) return <Skeleton className="h-[60vh] w-full rounded-[2.5rem]" />;
    if (!stats) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black italic tracking-tighter">Global <span className="text-primary">Conversion</span></h2>
                    <p className="text-xs font-black uppercase tracking-widest text-foreground">Admin Funnel Dashboard</p>
                </div>

                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl glass glass-dark">
                    <button onClick={() => setDateFilter('today')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${dateFilter === 'today' ? 'bg-primary text-white shadow-lg' : 'text-foreground hover:text-foreground'}`}>Hoy</button>
                    <button onClick={() => setDateFilter('7days')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${dateFilter === '7days' ? 'bg-primary text-white shadow-lg' : 'text-foreground hover:text-foreground'}`}>7 Días</button>
                    <button onClick={() => setDateFilter('month')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${dateFilter === 'month' ? 'bg-primary text-white shadow-lg' : 'text-foreground hover:text-foreground'}`}>Este Mes</button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass glass-dark border-primary/10 rounded-[2.5rem] p-8 flex flex-col justify-center shadow-xl">
                    <div className="space-y-2">
                        <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-4">
                            <Target className="h-6 w-6 text-primary" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-foreground">Tasa de Retención (Recurrentes)</p>
                        <h3 className="text-6xl font-black text-foreground tracking-tighter">
                            {stats.retentionRate.toFixed(1)}<span className="text-primary text-4xl">%</span>
                        </h3>
                        <p className="text-sm font-bold text-foreground leading-relaxed mt-4">
                            De los <span className="text-foreground">{stats.totalShoppers}</span> usuarios que compraron en este periodo, <span className="text-primary">{Math.round(stats.retentionRate)}%</span> volvieron a realizar un pedido.
                        </p>
                    </div>
                </Card>

                <Card className="glass glass-dark border-black/10 dark:border-white/10 rounded-[2.5rem] shadow-xl overflow-hidden relative">
                    <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Filter className="h-4 w-4 text-primary" /> Embudo de Ventas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <FunnelChart>
                                <Tooltip 
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass glass-dark p-3 rounded-xl border border-white/10 shadow-xl">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-1">{payload[0].payload.name}</p>
                                                    <p className="text-xl font-black text-primary">{payload[0].value}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Funnel dataKey="value" data={stats.funnelData} isAnimationActive>
                                    <LabelList position="right" fill="currentColor" stroke="none" dataKey="name" fontSize={12} className="font-bold opacity-60" />
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={() => generateCSV(stats.successfulOrders, `Reporte_Global_${dateFilter}`)} className="h-12 px-6 rounded-2xl font-black gap-2 mt-4 bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <Download className="h-5 w-5" />
                    Exportar Base de Órdenes CSV
                </Button>
            </div>
        </div>
    );
}


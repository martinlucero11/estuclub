'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import { Order } from '@/types/data';
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    ShoppingBag, 
    DollarSign,
    ArrowUpRight,
    Zap,
    Download
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GlobalAnalyticsDashboard from '@/components/analytics/GlobalAnalyticsDashboard';
import { subDays, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { generateCSV } from '@/lib/export-utils';

function AnalyticsHeader() {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(203,70,90,0.1)]">
                        <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.3em] border-white/5 opacity-40">Business Intelligence</Badge>
                </div>
                <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic font-montserrat">
                    Data <span className="text-primary italic">Core</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Análisis profundo de ventas y conversión en tiempo real.</p>
            </div>

            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl p-4 rounded-[2rem] border border-white/10">
                 <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-emerald-500" />
                 </div>
                 <div className="pr-4">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-tight">Master Sync</p>
                    <p className="text-xs font-bold text-white/80">Live Data Active</p>
                 </div>
            </div>
        </div>
    );
}

function RealTimeKPIs() {
    const firestore = useFirestore();
    
    // Last 30 days orders
    const thirtyDaysAgo = subDays(new Date(), 30);
    const ordersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'orders').withConverter(createConverter<Order>()),
            where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
        );
    }, [firestore]);

    const { data: recentOrders, isLoading } = useCollection(ordersQuery);

    const stats = useMemo(() => {
        if (!recentOrders) return { revenue: 0, count: 0, customers: new Set() };
        return recentOrders.reduce((acc, order) => {
            if (['delivered', 'completed', 'accepted', 'assigned', 'shipped'].includes(order.status)) {
                acc.revenue += (order.total || 0);
                acc.count++;
                if (order.customerId) acc.customers.add(order.customerId);
            }
            return acc;
        }, { revenue: 0, count: 0, customers: new Set<string>() });
    }, [recentOrders]);

    if (isLoading) return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-[2.5rem]" />)}
        </div>
    );

    const kpis = [
        { label: 'Facturación (30D)', value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Órdenes Activas', value: stats.count, icon: ShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Clientes Activos', value: stats.customers.size, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {kpis.map((kpi) => (
                <Card key={kpi.label} className="rounded-[2.5rem] border-white/5 glass-dark p-8 group hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-start">
                        <div className={`p-4 rounded-2xl ${kpi.bg}`}>
                            <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                            <ArrowUpRight className="h-3 w-3" /> Live
                        </div>
                    </div>
                    <div className="mt-6 space-y-1">
                        <h3 className="text-3xl font-black tracking-tighter leading-none">{kpi.value}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{kpi.label}</p>
                    </div>
                </Card>
            ))}
        </div>
    );
}

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-10 animate-in fade-in duration-700 min-h-screen pb-20">
            <AnalyticsHeader />
            
            <RealTimeKPIs />

            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Conversion <span className="text-primary italic">Funnel</span></h2>
                </div>
                <GlobalAnalyticsDashboard />
            </div>

            <Card className="rounded-[2.5rem] border-white/5 glass-dark p-12 mt-12 overflow-hidden relative group">
                <div className="absolute -right-20 -top-20 h-64 w-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all" />
                <div className="relative z-10 space-y-6 text-center max-w-2xl mx-auto">
                    <div className="h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
                         <Download className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Export Center</h3>
                    <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest leading-relaxed">
                        Descarga la base de datos completa de transacciones para análisis externo offline.
                    </p>
                    <Button className="h-14 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px] hover:bg-primary hover:text-white transition-all shadow-2xl">
                        Descargar Reporte Anual
                    </Button>
                </div>
            </Card>
        </div>
    );
}



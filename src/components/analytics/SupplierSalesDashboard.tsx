'use client';

import React, { useMemo, useState } from 'react';
import { useCollectionOnce, useFirestore, useDocOnce } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import { Order, Product, SupplierProfile } from '@/types/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subDays, startOfDay, endOfDay, startOfMonth, isAfter, isBefore, format } from 'date-fns';
import { AlertTriangle, Clock, Download, Ghost, Package, Receipt, Star, TrendingUp } from 'lucide-react';
import { generateCSV } from '@/lib/export-utils';
import { useAdmin } from '@/context/admin-context';
import { useUser } from '@/firebase';

interface SupplierSalesDashboardProps {
    supplierId: string;
}

export default function SupplierSalesDashboard({ supplierId: initialSupplierId }: SupplierSalesDashboardProps) {
    const firestore = useFirestore();
    const { roles } = useUser();
    const { impersonatedSupplierId } = useAdmin();
    const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month'>('month');

    const supplierId = (roles.includes('admin') && impersonatedSupplierId) ? impersonatedSupplierId : initialSupplierId;

    // Fetch Orders & Products
    const ordersQuery = useMemo(() => 
        query(collection(firestore, 'orders').withConverter(createConverter<Order>()), where('supplierId', '==', supplierId), orderBy('createdAt', 'desc')),
        [firestore, supplierId]
    );
    const { data: allOrders, isLoading: ordersLoading } = useCollectionOnce<Order>(ordersQuery);

    const productsQuery = useMemo(() => 
        query(collection(firestore, 'products').withConverter(createConverter<Product>()), where('supplierId', '==', supplierId)),
        [firestore, supplierId]
    );
    const { data: allProducts, isLoading: productsLoading } = useCollectionOnce<Product>(productsQuery);

    const stats = useMemo(() => {
        if (!allOrders || !allProducts) return null;

        const now = new Date();
        let startDate: Date;

        if (dateFilter === 'today') {
            startDate = startOfDay(now);
        } else if (dateFilter === '7days') {
            startDate = subDays(now, 7);
        } else {
            startDate = subDays(now, 30);
        }

        // Filter Orders by Date
        const filteredOrders = allOrders.filter(o => o.createdAt && isAfter(o.createdAt.toDate(), startDate));
        const successfulOrders = filteredOrders.filter(o => ['delivered', 'completed', 'shipped', 'arrived'].includes(o.status));

        // 1. Gross Revenue
        const grossRevenue = successfulOrders.reduce((sum, o) => sum + (o.total || o.subtotal || 0), 0);

        // 2. Average Ticket
        const avgTicket = successfulOrders.length > 0 ? (grossRevenue / successfulOrders.length) : 0;

        // 3. Product Performance (Top 3)
        const productSales = new Map<string, { name: string, count: number, revenue: number }>();
        successfulOrders.forEach(o => {
            o.items?.forEach(item => {
                const current = productSales.get(item.productId) || { name: item.name, count: 0, revenue: 0 };
                productSales.set(item.productId, {
                    name: item.name,
                    count: current.count + item.quantity,
                    revenue: current.revenue + (item.price * item.quantity)
                });
            });
        });

        const topProducts = Array.from(productSales.values())
            .sort((a,b) => b.count - a.count)
            .slice(0, 3);

        // 4. Daily Trend for Recharts
        const dailyDataMap = new Map<string, number>();
        // Fill last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = subDays(now, i);
            dailyDataMap.set(format(date, 'dd/MM'), 0);
        }

        successfulOrders.forEach(o => {
            const day = format(o.createdAt.toDate(), 'dd/MM');
            if (dailyDataMap.has(day)) {
                dailyDataMap.set(day, dailyDataMap.get(day)! + (o.total || o.subtotal || 0));
            }
        });

        const chartData = Array.from(dailyDataMap.entries()).map(([date, revenue]) => ({ date, revenue }));

        return {
            grossRevenue,
            totalOrders: successfulOrders.length,
            avgTicket,
            topProducts,
            chartData,
            filteredOrders
        };
    }, [allOrders, allProducts, dateFilter]);

    if (ordersLoading || productsLoading) return <Skeleton className="h-96 w-full rounded-[2rem]" />;
    if (!stats) return null;

    return (
        <div className="space-y-10">
            {/* Context Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex bg-black/[0.03] dark:bg-white/5 p-1.5 rounded-2xl glass glass-dark border border-black/5 dark:border-white/10">
                    <button onClick={() => setDateFilter('today')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === 'today' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-foreground'}`}>Hoy</button>
                    <button onClick={() => setDateFilter('7days')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === '7days' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-foreground'}`}>7 Días</button>
                    <button onClick={() => setDateFilter('month')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === 'month' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-foreground'}`}>30 Días</button>
                </div>
                
                <Button variant="outline" size="sm" onClick={() => generateCSV(stats.filteredOrders, `Reporte_Ventas_${dateFilter}`)} className="h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-lg">
                    <Download className="h-4 w-4" /> Exportar Datos
                </Button>
            </div>

            {/* Principal Métricas */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="glass glass-dark border-primary/10 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-transparent shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Ingresos Brutos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tighter italic">
                            ${Math.round(stats.grossRevenue).toLocaleString()}
                        </div>
                        <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase">Ventas totalizadas</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 flex items-center gap-2">
                            <Package className="h-4 w-4" /> Volumen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tighter italic">
                            {stats.totalOrders}
                        </div>
                        <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase">Pedidos exitosos</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 flex items-center gap-2">
                            <Receipt className="h-4 w-4" /> Ticket Promedio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tighter italic">
                            ${Math.round(stats.avgTicket).toLocaleString()}
                        </div>
                        <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase">Por orden individual</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-xl bg-black dark:bg-white/5 group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Star className="h-4 w-4" /> Top Ventas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats.topProducts.map((p, i) => (
                            <div key={i} className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                <span className="text-[11px] font-black text-white/80 leading-tight uppercase line-clamp-1">{p.name}</span>
                                <span className="text-[11px] font-black text-primary ml-2">{p.count}u</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Growth Chart */}
            <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black italic flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-primary" /> Curva de Ventas (30 Días)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] w-full p-8 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                            <defs>
                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 900, opacity: 0.3 }} 
                                dy={15}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'currentColor', fontSize: 9, fontWeight: 900, opacity: 0.3 }}
                                hide
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="glass glass-dark p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/40 mb-1">{payload[0].payload.date}</p>
                                                <p className="text-xl font-black text-primary">${payload[0].value.toLocaleString()}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}


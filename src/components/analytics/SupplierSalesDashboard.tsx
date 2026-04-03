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
        query(collection(firestore, 'orders').withConverter(createConverter<Order>()), where('supplierId', '==', supplierId)),
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
            startDate = startOfMonth(now);
        }

        // Filter Orders by Date
        const filteredOrders = allOrders.filter(o => o.createdAt && isAfter(o.createdAt.toDate(), startDate));
        const successfulOrders = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'searching_rider' || o.status === 'accepted' || o.status === 'pending_payment');

        // 1. Peak Ordering Hours
        const heatmapData = successfulOrders.reduce((acc, o) => {
            if (!o.createdAt) return acc;
            const hour = o.createdAt.toDate().getHours();
            acc[hour] = (acc[hour] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
        
        const peakHours = Object.entries(heatmapData)
            .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
            .sort((a,b) => parseInt(a.hour) - parseInt(b.hour));
        
        let maxCount = 0;
        let peakHourLabel = 'N/A';
        peakHours.forEach(p => { if (p.count > maxCount) { maxCount = p.count; peakHourLabel = p.hour; } });

        // 2. Average Ticket
        const totalRevenue = successfulOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
        const avgTicket = successfulOrders.length > 0 ? (totalRevenue / successfulOrders.length) : 0;

        // 3. Product Performance (Sales vs Views)
        const productSales = new Map<string, number>();
        successfulOrders.forEach(o => {
            o.items?.forEach(item => {
                productSales.set(item.productId, (productSales.get(item.productId) || 0) + item.quantity);
            });
        });

        const productStats = allProducts.map(p => ({
            ...p,
            salesCount: productSales.get(p.id) || 0,
            viewsCount: p.viewsCount || 0
        }));

        const topSeller = [...productStats].sort((a,b) => b.salesCount - a.salesCount)[0];
        
        // Ghost Product: High views, 0 or very low sales.
        const ghostProduct = [...productStats]
            .filter(p => p.viewsCount > 5) // At least some views
            .sort((a, b) => {
                // Ratio penalty: (views - sales * 10)
                const ratioA = a.viewsCount - (a.salesCount * 10);
                const ratioB = b.viewsCount - (b.salesCount * 10);
                return ratioB - ratioA;
            })[0];

        return {
            totalRevenue,
            totalOrders: successfulOrders.length,
            avgTicket,
            peakHours,
            peakHourLabel,
            topSeller,
            ghostProduct,
            filteredOrders
        };
    }, [allOrders, allProducts, dateFilter]);

    if (ordersLoading || productsLoading) return <Skeleton className="h-96 w-full rounded-[2rem]" />;
    if (!stats) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl glass glass-dark">
                    <button onClick={() => setDateFilter('today')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${dateFilter === 'today' ? 'bg-primary text-white shadow-lg' : 'text-foreground hover:text-foreground'}`}>Hoy</button>
                    <button onClick={() => setDateFilter('7days')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${dateFilter === '7days' ? 'bg-primary text-white shadow-lg' : 'text-foreground hover:text-foreground'}`}>7 Días</button>
                    <button onClick={() => setDateFilter('month')} className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${dateFilter === 'month' ? 'bg-primary text-white shadow-lg' : 'text-foreground hover:text-foreground'}`}>Este Mes</button>
                </div>
                
                <Button variant="outline" size="sm" onClick={() => generateCSV(stats.filteredOrders, `Reporte_Ventas_${dateFilter}`)} className="h-9 rounded-xl font-bold gap-2">
                    <Download className="h-4 w-4" />
                    Exportar Reporte
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="glass glass-dark border-primary/10 rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                            <Receipt className="h-4 w-4" /> Ticket Promedio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-primary tracking-tighter">
                            ${Math.round(stats.avgTicket).toLocaleString()}
                        </div>
                        <p className="text-xs font-medium text-foreground mt-2">En {stats.totalOrders} pedidos procesados</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-green-500/20 rounded-[2rem] bg-gradient-to-br from-green-500/5 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-green-500 flex items-center gap-2">
                            <Star className="h-4 w-4" /> Producto Estrella
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.topSeller && stats.topSeller.salesCount > 0 ? (
                            <>
                                <div className="text-xl font-black text-foreground truncate">{stats.topSeller.name}</div>
                                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold">
                                    <Package className="h-3 w-3" /> {stats.topSeller.salesCount} unidades vendidas
                                </div>
                            </>
                        ) : (
                            <div className="text-foreground text-sm font-medium italic">Sin ventas registradas en el período.</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-destructive/20 rounded-[2rem] bg-gradient-to-br from-destructive/5 to-transparent relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                        <Ghost className="h-32 w-32 text-destructive" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-destructive flex items-center gap-2">
                            <Ghost className="h-4 w-4" /> Producto Fantasma
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {stats.ghostProduct && stats.ghostProduct.viewsCount > 0 && stats.ghostProduct.salesCount === 0 ? (
                            <>
                                <div className="text-xl font-black text-foreground truncate">{stats.ghostProduct.name}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-destructive/10 text-destructive rounded-md text-[10px] font-black uppercase">
                                        LO VENDA: 0
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded-md text-[10px] font-black uppercase">
                                        LO VEN: {stats.ghostProduct.viewsCount}
                                    </div>
                                </div>
                                <p className="text-[10px] font-medium text-destructive/80 mt-2 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Revisá foto o precio.
                                </p>
                            </>
                        ) : (
                            <div className="text-foreground text-sm font-medium italic">Catálogo saludable.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="glass glass-dark border-black/10 dark:border-white/10 rounded-[2rem] overflow-hidden">
                <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-black italic flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" /> Horas Pico de Pedidos
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] w-full pt-4">
                    {stats.peakHours.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.peakHours} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis 
                                    dataKey="hour" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.5 }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.5 }}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass glass-dark p-3 rounded-xl border border-white/10 shadow-xl">
                                                    <p className="text-xs font-black text-foreground mb-1">{payload[0].payload.hour}</p>
                                                    <p className="text-lg font-black text-primary">{payload[0].value} Pedidos</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {stats.peakHours.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.hour === stats.peakHourLabel ? 'hsl(var(--primary))' : 'rgba(var(--primary-rgb), 0.2)'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm font-medium italic text-foreground">
                            No hay datos suficientes para calcular las horas pico en este rango.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


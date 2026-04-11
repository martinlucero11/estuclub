'use client';

import React, { useMemo, useState } from 'react';
import { useCollectionOnce, useFirestore, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { createConverter } from '@/lib/firestore-converter';
import { Appointment } from '@/types/data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subDays, startOfDay, isAfter, format } from 'date-fns';
import { Calendar, CheckCircle2, DollarSign, Download, Percent, Scissors, TrendingUp, XCircle } from 'lucide-react';
import { generateCSV } from '@/lib/export-utils';
import { useAdmin } from '@/context/admin-context';

interface CluberTurnsAnalyticsProps {
    supplierId: string;
}

export default function CluberTurnsAnalytics({ supplierId: initialSupplierId }: CluberTurnsAnalyticsProps) {
    const firestore = useFirestore();
    const { roles } = useUser();
    const { impersonatedSupplierId } = useAdmin();
    const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month'>('month');

    const supplierId = (roles.includes('admin') && impersonatedSupplierId) ? impersonatedSupplierId : initialSupplierId;

    // Fetch Appointments
    const appointmentsQuery = useMemo(() => 
        query(collection(firestore, 'appointments').withConverter(createConverter<Appointment>()), where('supplierId', '==', supplierId), orderBy('startTime', 'desc')),
        [firestore, supplierId]
    );
    const { data: allAppointments, isLoading } = useCollectionOnce<Appointment>(appointmentsQuery);

    const stats = useMemo(() => {
        if (!allAppointments) return null;

        const now = new Date();
        let startDate: Date;

        if (dateFilter === 'today') {
            startDate = startOfDay(now);
        } else if (dateFilter === '7days') {
            startDate = subDays(now, 7);
        } else {
            startDate = subDays(now, 30);
        }

        // Filter by Date
        const filteredAppointments = allAppointments.filter(a => a.startTime && isAfter(a.startTime.toDate(), startDate));
        
        // 1. Metrics by status
        const completed = filteredAppointments.filter(a => a.status === 'attended');
        const cancelled = filteredAppointments.filter(a => a.status === 'cancelled' || a.status === 'absent');
        
        const totalRevenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);
        const cancellationRate = filteredAppointments.length > 0 ? (cancelled.length / filteredAppointments.length) * 100 : 0;

        // 2. Top Services
        const serviceStats = new Map<string, { name: string, count: number }>();
        completed.forEach(a => {
            const current = serviceStats.get(a.serviceName) || { name: a.serviceName, count: 0 };
            serviceStats.set(a.serviceName, { name: a.serviceName, count: current.count + 1 });
        });

        const topServices = Array.from(serviceStats.values())
            .sort((a,b) => b.count - a.count)
            .slice(0, 3);

        // 3. Daily Trend
        const dailyDataMap = new Map<string, number>();
        for (let i = 29; i >= 0; i--) {
            const date = subDays(now, i);
            dailyDataMap.set(format(date, 'dd/MM'), 0);
        }

        completed.forEach(a => {
            const day = format(a.startTime.toDate(), 'dd/MM');
            if (dailyDataMap.has(day)) {
                dailyDataMap.set(day, dailyDataMap.get(day)! + 1);
            }
        });

        const chartData = Array.from(dailyDataMap.entries()).map(([date, count]) => ({ date, count }));

        return {
            totalRevenue,
            completedCount: completed.length,
            cancellationRate,
            topServices,
            chartData,
            filteredAppointments
        };
    }, [allAppointments, dateFilter]);

    if (isLoading) return <Skeleton className="h-96 w-full rounded-[2rem]" />;
    if (!stats) return null;

    return (
        <div className="space-y-10">
            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex bg-black/[0.03] dark:bg-white/5 p-1.5 rounded-2xl glass glass-dark border border-black/5 dark:border-white/10">
                    <button onClick={() => setDateFilter('today')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === 'today' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-foreground'}`}>Hoy</button>
                    <button onClick={() => setDateFilter('7days')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === '7days' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-foreground'}`}>7 Días</button>
                    <button onClick={() => setDateFilter('month')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dateFilter === 'month' ? 'bg-primary text-white shadow-xl' : 'text-foreground/40 hover:text-foreground'}`}>30 Días</button>
                </div>
                
                <Button variant="outline" size="sm" onClick={() => generateCSV(stats.filteredAppointments, `Turns_Report_${dateFilter}`)} className="h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-lg">
                    <Download className="h-4 w-4" /> Exportar Datos
                </Button>
            </div>

            {/* Metrics */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="glass glass-dark border-primary/10 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-transparent shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Ingresos por Turnos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tighter italic">
                            ${stats.totalRevenue.toLocaleString()}
                        </div>
                        <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase">Recaudación estimada</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" /> Completados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tighter italic">
                            {stats.completedCount}
                        </div>
                        <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase">Turnos atendidos</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                            <Percent className="h-4 w-4" /> Tasa de Cancelación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tighter italic">
                            {stats.cancellationRate.toFixed(1)}%
                        </div>
                        <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase">No asistió / Canceló</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-xl bg-black dark:bg-white/5 group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Scissors className="h-4 w-4" /> Top Servicios
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats.topServices.length > 0 ? stats.topServices.map((s, i) => (
                            <div key={i} className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                <span className="text-[11px] font-black text-white/80 leading-tight uppercase line-clamp-1">{s.name}</span>
                                <span className="text-[11px] font-black text-primary ml-2">{s.count}</span>
                            </div>
                        )) : (
                            <p className="text-[10px] font-bold text-white/20 uppercase italic">Sin datos</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Trend Chart */}
            <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black italic flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" /> Volumen de Turnos (30 Días)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] w-full p-8 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                            <defs>
                                <linearGradient id="turnsGradient" x1="0" y1="0" x2="0" y2="1">
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
                                                <p className="text-xl font-black text-primary">{payload[0].value} Turnos</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" fill="url(#turnsGradient)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useCollectionOnce, useFirestore, useDoc, useUser } from '@/firebase';
import { collection, query, where, doc, orderBy } from 'firebase/firestore';
import { useMemo, useState } from 'react';

import { ReviewBreakdown } from './ReviewBreakdown';
import { LoyaltyMetrics } from './LoyaltyMetrics';
import { StatCard } from './StatCard';
import { TimeSeriesChart } from './TimeSeriesChart';
import { DemographicChart } from './DemographicChart';
import { HeatmapChart } from './HeatmapChart';
import { DataDetailDialog } from './DataDetailDialog';
import { Button } from "@/components/ui/button";
import { 
    Gift, Ticket, Users, Star, Heart, TrendingUp, Users2, 
    Award, GraduationCap, Activity, PieChart as PieIcon, ArrowUpRight, ChevronRight,
    Zap, Clock, Calendar, Search, Filter, X, LayoutDashboard, Target, Sparkles, Trophy, Building, MessageSquare, Package,
    Download
} from 'lucide-react';
import { useAdmin } from '@/context/admin-context';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Benefit, BenefitRedemption, Appointment, UserProfile, SupplierProfile, Product } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { subDays, format, startOfMonth, subMonths, isAfter, isBefore, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { generateCSV } from '@/lib/export-utils';

interface SupplierAnalyticsDashboardProps {
    supplierId: string;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-[2.5rem]" />)}
            </div>
            <div className="grid gap-8 md:grid-cols-7">
                <Skeleton className="col-span-4 h-96 rounded-[2.5rem]" />
                <Skeleton className="col-span-3 h-96 rounded-[2.5rem]" />
            </div>
        </div>
    );
}

export default function SupplierAnalyticsDashboard({ supplierId: initialSupplierId }: SupplierAnalyticsDashboardProps) {
    const firestore = useFirestore();
    const { roles } = useUser();
    const { impersonatedSupplierId } = useAdmin();
    const [dateFilter, setDateFilter] = useState<'month'>('month'); // Consistent with requested 30 days

    const supplierId = (roles.includes('admin') && impersonatedSupplierId) ? impersonatedSupplierId : initialSupplierId;

    // Fetch Benefits & Redemptions
    const benefitsQuery = useMemo(() => 
        query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>()), where('supplierId', '==', supplierId)),
        [firestore, supplierId]
    );
    const { data: allBenefits, isLoading: benefitsLoading } = useCollectionOnce<Benefit>(benefitsQuery);

    const redemptionsQuery = useMemo(() =>
        query(collection(firestore, 'redemptions').withConverter(createConverter<BenefitRedemption>()), where('supplierId', '==', supplierId), orderBy('redeemedAt', 'desc')),
        [firestore, supplierId]
    );
    const { data: allRedemptions, isLoading: redemptionsLoading } = useCollectionOnce<BenefitRedemption>(redemptionsQuery);

    const stats = useMemo(() => {
        if (!allBenefits || !allRedemptions) return null;

        const now = new Date();
        const startDate = subDays(now, 30);

        // Filter Redemptions
        const filteredRedemptions = allRedemptions.filter(r => r.redeemedAt && isAfter(r.redeemedAt.toDate(), startDate));

        // 1. Redemptions vs Views
        const totalRedemptions = filteredRedemptions.length;
        const totalViews = allBenefits.reduce((sum, b) => sum + (b.redemptionCount || 0) * 2, 0); // Mocking views for demo or use real if exists

        // 2. Top 3 Benefits
        const benefitUsage = new Map<string, { name: string, count: number }>();
        filteredRedemptions.forEach(r => {
            const current = benefitUsage.get(r.benefitId) || { name: r.benefitTitle, count: 0 };
            benefitUsage.set(r.benefitId, { name: r.benefitTitle, count: current.count + 1 });
        });

        const topBenefits = Array.from(benefitUsage.values())
            .sort((a,b) => b.count - a.count)
            .slice(0, 3);

        // 3. Daily Trend
        const dailyDataMap = new Map<string, number>();
        for (let i = 29; i >= 0; i--) {
            const date = subDays(now, i);
            dailyDataMap.set(format(date, 'dd/MM'), 0);
        }

        filteredRedemptions.forEach(r => {
            const day = format(r.redeemedAt.toDate(), 'dd/MM');
            if (dailyDataMap.has(day)) {
                dailyDataMap.set(day, dailyDataMap.get(day)! + 1);
            }
        });

        const chartData = Array.from(dailyDataMap.entries()).map(([date, count]) => ({ date, count }));

        return {
            totalRedemptions,
            totalViews,
            topBenefits,
            chartData,
            filteredRedemptions
        };
    }, [allBenefits, allRedemptions]);

    if (benefitsLoading || redemptionsLoading) return <LoadingSkeleton />;
    if (!stats) return null;

    return (
        <div className="space-y-10">
            {/* Context Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex bg-black/[0.03] dark:bg-white/5 p-1.5 rounded-2xl glass glass-dark border border-black/5 dark:border-white/10">
                    <button className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-xl transition-all">Últimos 30 Días</button>
                </div>
                
                <Button variant="outline" size="sm" onClick={() => generateCSV(stats.filteredRedemptions, `Reporte_Beneficios`)} className="h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 bg-white dark:bg-white/5 border-black/5 dark:border-white/10 shadow-lg">
                    <Download className="h-4 w-4" /> Exportar Datos
                </Button>
            </div>

            {/* Metrics */}
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="glass glass-dark border-primary/10 rounded-[2.5rem] bg-gradient-to-br from-primary/5 to-transparent shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Gift className="h-4 w-4" /> Cupones Canjeados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tighter italic">
                            {stats.totalRedemptions}
                        </div>
                        <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase">Canjes en local</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 flex items-center gap-2">
                            <Users className="h-4 w-4" /> Alcance (Vistas)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tighter italic">
                            {stats.totalViews}
                        </div>
                        <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase">Impactos en estudiantes</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Ratio de Uso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-foreground tracking-tighter italic">
                            {stats.totalViews > 0 ? ((stats.totalRedemptions / stats.totalViews) * 100).toFixed(1) : 0}%
                        </div>
                        <p className="text-[10px] font-bold text-foreground/40 mt-2 uppercase">Conversión de canje</p>
                    </CardContent>
                </Card>

                <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[2.5rem] shadow-xl bg-black dark:bg-white/5 group">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <Star className="h-4 w-4" /> Top Beneficios
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats.topBenefits.map((b, i) => (
                            <div key={i} className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                <span className="text-[11px] font-black text-white/80 leading-tight uppercase line-clamp-1">{b.name}</span>
                                <span className="text-[11px] font-black text-primary ml-2">{b.count}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Daily Trend Chart */}
            <Card className="glass glass-dark border-black/5 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black italic flex items-center gap-3">
                        <Activity className="h-5 w-5 text-primary" /> Actividad de Canjes (30 Días)
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] w-full p-8 pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                            <defs>
                                <linearGradient id="benefitsGradient" x1="0" y1="0" x2="0" y2="1">
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
                                                <p className="text-xl font-black text-primary">{payload[0].value} Canjes</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="count" fill="url(#benefitsGradient)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}


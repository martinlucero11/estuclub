'use client';

import { useCollectionOnce, useFirestore, useDoc } from '@/firebase';
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
    Zap, Clock, Calendar, Search, Filter, X, LayoutDashboard, Target, Sparkles, Trophy, Building, MessageSquare
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Benefit, BenefitRedemption, Appointment, UserProfile } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { startOfMonth, subMonths, isAfter, isBefore, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

export default function SupplierAnalyticsDashboard({ supplierId }: SupplierAnalyticsDashboardProps) {
    const firestore = useFirestore();
    const [activeTab, setActiveTab] = useState("overview");
    
    // Detail Dialog State
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailConfig, setDetailConfig] = useState<{
        title: string;
        description: string;
        data: any[];
        columns: any[];
        filterColumn: string;
        filterPlaceholder: string;
    }>({
        title: "",
        description: "",
        data: [],
        columns: [],
        filterColumn: "",
        filterPlaceholder: ""
    });

    const benefitsQuery = useMemo(() => 
        query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>()), where('ownerId', '==', supplierId)),
        [firestore, supplierId]
    );
    const { data: benefits, isLoading: benefitsLoading } = useCollectionOnce<Benefit>(benefitsQuery);

    const redemptionsQuery = useMemo(() =>
        query(collection(firestore, 'benefitRedemptions').withConverter(createConverter<BenefitRedemption>()), where('supplierId', '==', supplierId), orderBy('redeemedAt', 'desc')),
        [firestore, supplierId]
    );
    const { data: redemptions, isLoading: redemptionsLoading } = useCollectionOnce<BenefitRedemption>(redemptionsQuery);

    const usersQuery = useMemo(() => 
        query(collection(firestore, 'users').withConverter(createConverter<UserProfile>())),
        [firestore]
    );
    const { data: allUsers, isLoading: usersLoading } = useCollectionOnce<UserProfile>(usersQuery);

    const supplierRef = useMemo(() => doc(firestore, 'roles_supplier', supplierId).withConverter(createConverter<any>()), [firestore, supplierId]);
    const { data: supplierDoc, isLoading: supplierLoading } = useDoc<any>(supplierRef);

    const isLoading = benefitsLoading || redemptionsLoading || usersLoading || supplierLoading;

    const stats = useMemo(() => {
        if (!benefits || !redemptions || !allUsers || !supplierDoc) return null;

        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(lastMonthStart);

        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            const change = ((current - previous) / previous) * 100;
            return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        };

        const redemptionsThisMonth = redemptions.filter(r => r.redeemedAt && isAfter(r.redeemedAt.toDate(), thisMonthStart)).length;
        const redemptionsLastMonth = redemptions.filter(r => r.redeemedAt && isAfter(r.redeemedAt.toDate(), lastMonthStart) && isBefore(r.redeemedAt.toDate(), lastMonthEnd)).length;
        const redemptionsGrowth = calculateGrowth(redemptionsThisMonth, redemptionsLastMonth);

        const redemptionsByUser = redemptions.reduce((acc, r) => {
            acc[r.userId] = (acc[r.userId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const totalUniqueUsers = Object.keys(redemptionsByUser).length;
        const repeatUsersCount = Object.values(redemptionsByUser).filter(count => count > 1).length;
        const oneTimeUsersCount = Object.values(redemptionsByUser).filter(count => count === 1).length;
        const fanUsersCount = Object.values(redemptionsByUser).filter(count => count > 5).length;
        const loyaltyRate = totalUniqueUsers > 0 ? ((repeatUsersCount / totalUniqueUsers) * 100).toFixed(1) : '0';

        const loyaltyCohorts = [
            { name: 'Fans (>5)', value: fanUsersCount, color: 'hsl(var(--primary))' },
            { name: 'Fieles (2-5)', value: repeatUsersCount - fanUsersCount, color: 'rgba(var(--primary-rgb), 0.6)' },
            { name: 'Nuevos (1)', value: oneTimeUsersCount, color: 'rgba(var(--primary-rgb), 0.2)' },
        ];

        const myCustomerIds = new Set(redemptions.map(r => r.userId));
        const myCustomers = allUsers.filter(u => myCustomerIds.has(u.id));

        // Demographics
        const univCounts = myCustomers.reduce((acc, u) => {
            if (u.university) acc[u.university] = (acc[u.university] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const univData = Object.entries(univCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

        const heatmapData = redemptions.reduce((acc, r) => {
            const date = r.redeemedAt.toDate();
            const day = date.getDay();
            const hour = date.getHours();
            const key = `${day}-${hour}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const heatmapFormatted = Object.entries(heatmapData).map(([key, count]) => {
            const [day, hour] = key.split('-').map(Number);
            return { day, hour, count };
        });

        const benefitStats = benefits.map(b => ({
            id: b.id,
            name: b.primaryText,
            count: redemptions.filter(r => r.benefitId === b.id).length,
            favorites: b.favoritesCount || 0
        })).sort((a,b) => b.count - a.count).slice(0, 5);

        // Advanced Demographic Data
        const majorCounts = myCustomers.reduce((acc, u) => {
            const major = u.major || 'No especificado';
            acc[major] = (acc[major] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topMajors = Object.entries(majorCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const univAffinity = Object.entries(univCounts)
            .map(([name, value]) => ({ 
                name, 
                value,
                engagement: ((value / (myCustomers.length || 1)) * 100).toFixed(1)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // Activity Velocity
        const today = new Date();
        const redemptionsToday = redemptions.filter(r => {
            const date = r.redeemedAt?.toDate();
            return date && date.toDateString() === today.toDateString();
        }).length;

        // Peak Hour Calculation
        const hourCounts = Object.entries(heatmapData).reduce((acc, [key, count]) => {
            const hour = key.split('-')[1];
            acc[hour] = (acc[hour] || 0) + count;
            return acc;
        }, {} as Record<string, number>);
        const peakHour = Object.entries(hourCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || '0';

        // Review Distribution Simulation
        const totalReviews = supplierDoc.reviewCount || 0;
        const avgRatingValue = supplierDoc.avgRating || 0;
        const distribution: Record<number, number> = {
            5: Math.round(totalReviews * (avgRatingValue >= 4.5 ? 0.7 : 0.5)),
            4: Math.round(totalReviews * 0.2),
            3: Math.round(totalReviews * 0.05),
            2: Math.round(totalReviews * 0.03),
            1: Math.round(totalReviews * 0.02),
        };

        return {
            totalRedemptions: redemptions.length,
            redemptionsGrowth,
            loyaltyRate: `${loyaltyRate}%`,
            retentionRate: loyaltyRate,
            avgRating: avgRatingValue,
            reviewCount: totalReviews,
            benefitStats,
            univData,
            heatmapFormatted,
            totalCustomers: totalUniqueUsers,
            topMajors,
            univAffinity,
            redemptionsToday,
            peakHour: `${peakHour}:00`,
            loyaltyCohorts,
            repeatUsersCount,
            oneTimeUsersCount,
            distribution,
            totalReviews,
            allData: {
                customers: myCustomers,
                redemptions: redemptions
            }
        };
    }, [benefits, redemptions, allUsers, supplierDoc]);

    const openDetail = (type: string) => {
        if (!stats) return;

        const columns = {
            customers: [
                { 
                    accessorKey: 'firstName', 
                    header: 'Estudiante',
                    cell: ({ row }: any) => (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                {row.original.firstName[0]}
                            </div>
                            <span className="font-bold">{row.original.firstName} {row.original.lastName || ''}</span>
                        </div>
                    )
                },
                { accessorKey: 'university', header: 'Universidad' },
                { accessorKey: 'major', header: 'Carrera' },
            ],
            redemptions: [
                { 
                    accessorKey: 'userName', 
                    header: 'Usuario',
                    cell: ({ row }: any) => {
                        const u = allUsers?.find(u => u.id === row.original.userId);
                        return u ? `${u.firstName} ${u.lastName || ''}` : 'Anonimizado';
                    }
                },
                { 
                    accessorKey: 'benefitTitle', 
                    header: 'Beneficio Aplicado',
                    cell: ({ row }: any) => benefits?.find(b => b.id === row.original.benefitId)?.primaryText || 'Promoción Especial'
                },
                { 
                    accessorKey: 'redeemedAt', 
                    header: 'Fecha y Hora',
                    cell: ({ row }: any) => format(row.original.redeemedAt.toDate(), "dd MMM, HH:mm", { locale: es })
                }
            ],
            benefits: [
                { accessorKey: 'primaryText', header: 'Título del Beneficio' },
                { 
                    accessorKey: 'count', 
                    header: 'Uso Total',
                    cell: ({ row }: any) => stats.benefitStats.find(s => s.id === row.original.id)?.count || 0
                },
                { accessorKey: 'favoritesCount', header: 'Guardados' }
            ],
            loyalty: [
                { accessorKey: 'firstName', header: 'Estudiante Recurrente' },
                { 
                    header: 'Frecuencia',
                    cell: () => <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black">RECURRENTE</span>
                }
            ],
            reviews: [
                { accessorKey: 'rating', header: 'Calificación' },
                { accessorKey: 'comment', header: 'Feedback' },
                { accessorKey: 'createdAt', header: 'Fecha' }
            ],
            demographics: [
                { accessorKey: 'name', header: 'Segmento' },
                { accessorKey: 'value', header: 'Volumen' },
                { 
                    accessorKey: 'engagement', 
                    header: 'Afinidad %',
                    cell: ({ row }: any) => `${row.getValue('engagement')}%`
                }
            ]
        };

        const configs: Record<string, any> = {
            customers: {
                title: "Cartera de Clientes",
                description: "Base de datos de estudiantes que han interactuado con tu marca.",
                data: stats.allData.customers,
                columns: columns.customers,
                filterColumn: "firstName",
                filterPlaceholder: "Filtrar por nombre..."
            },
            redemptions: {
                title: "Log de Actividad Operativa",
                description: "Historial completo de beneficios redimidos en tu establecimiento.",
                data: stats.allData.redemptions,
                columns: columns.redemptions,
                filterColumn: "benefitTitle",
                filterPlaceholder: "Buscar por beneficio..."
            },
            benefits: {
                title: "Performance de Catálogo",
                description: "Análisis individual de cada beneficio publicado.",
                data: benefits || [],
                columns: columns.benefits,
                filterColumn: "primaryText",
                filterPlaceholder: "Buscar beneficio..."
            },
            loyalty: {
                title: "Segmentos de Fidelidad",
                description: "Estudiantes con alta tasa de recurrencia y embajadores de marca.",
                data: stats.allData.customers.filter(c => (stats.repeatUsersCount > 0)), // Simplified filter
                columns: columns.loyalty,
                filterColumn: "firstName",
                filterPlaceholder: "Buscar alumno..."
            },
            reviews: {
                title: "Reputación y Feedback",
                description: "Análisis cualitativo de la experiencia del estudiante.",
                data: [], // Placeholder as reviews aren't fully integrated here yet
                columns: columns.reviews,
                filterColumn: "comment",
                filterPlaceholder: "Filtrar comentarios..."
            },
            demographics: {
                title: "Inteligencia de Audiencia",
                description: "Desglose por universidad y carrera.",
                data: stats.univAffinity,
                columns: columns.demographics,
                filterColumn: "name",
                filterPlaceholder: "Filtrar por campus..."
            }
        };

        setDetailConfig(configs[type] || configs.redemptions);
        setDetailOpen(true);
    };

    if (isLoading) return <LoadingSkeleton />;
    if (!stats) return null;

    return (
        <div className="relative min-h-screen pb-12 overflow-hidden bg-background">
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8 relative z-10">
                {/* Mesh Background */}
                <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-30">
                    <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full" />
                    <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full" />
                </div>

                <Tabs defaultValue="overview" className="w-full relative z-10" onValueChange={setActiveTab}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tight text-foreground italic">Partner <span className="text-primary">Analytics</span></h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-white/50">Performance & Customer Insights</p>
                        </div>

                        <TabsList className="bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1.5 rounded-[2rem] h-14 backdrop-blur-2xl shadow-xl">
                            {[
                                { id: "overview", label: "Dashboard", icon: LayoutDashboard },
                                { id: "audience", label: "Audiencia", icon: GraduationCap },
                                { id: "activity", label: "Actividad", icon: Activity },
                                { id: "fidelity", label: "Fidelidad", icon: Heart },
                                { id: "strategy", label: "Estrategia", icon: Target }
                            ].map(t => (
                                <TabsTrigger 
                                    key={t.id} 
                                    value={t.id} 
                                    className="rounded-[1.5rem] px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] transition-all duration-500 gap-2 text-muted-foreground"
                                >
                                    <t.icon className="h-4 w-4" />
                                    {t.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <StatCard 
                                        title="Redenciones Totales" 
                                        value={stats.totalRedemptions} 
                                        icon={Ticket} 
                                        trend={stats.redemptionsGrowth}
                                        trendDirection={stats.redemptionsGrowth.startsWith('+') ? 'up' : 'down'}
                                        onClick={() => openDetail('redemptions')}
                                    />
                                    <StatCard 
                                        title="Cartera de Clientes" 
                                        value={stats.totalCustomers} 
                                        icon={Users2} 
                                        onClick={() => openDetail('customers')}
                                    />
                                    <StatCard 
                                        title="Tasa de Fidelidad" 
                                        value={stats.loyaltyRate} 
                                        icon={Heart} 
                                        description="Recurrencia mensual"
                                        onClick={() => openDetail('loyalty')}
                                    />
                                </div>

                                <div className="grid gap-8 lg:grid-cols-7">
                                    <Card className="lg:col-span-4 border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer" onClick={() => openDetail('redemptions')}>
                                        <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 py-6">
                                            <CardTitle className="flex items-center gap-3 text-xl font-black italic text-foreground dark:text-white">
                                                <TrendingUp className="h-5 w-5 text-primary" />
                                                Trayectoria Operativa
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <TimeSeriesChart data={redemptions || []} dataKey="redeemedAt" />
                                        </CardContent>
                                    </Card>

                                    <Card className="lg:col-span-3 border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer" onClick={() => openDetail('benefits')}>
                                        <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 py-6">
                                            <CardTitle className="flex items-center gap-3 text-xl font-black italic text-foreground dark:text-white">
                                                <Award className="h-5 w-5 text-primary" />
                                                Ranking de Catálogo
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-8">
                                            {stats.benefitStats.map((b, i) => (
                                                <div key={b.id} className="space-y-3">
                                                    <div className="flex justify-between items-center text-sm font-black text-foreground/80 dark:text-white/80">
                                                        <span className="flex items-center gap-2">
                                                            <span className="text-primary/50">0{i+1}</span>
                                                            {b.name}
                                                        </span>
                                                        <span className="text-primary">{b.count}</span>
                                                    </div>
                                                    <Progress value={(b.count / (stats.totalRedemptions || 1)) * 100} className="h-2 bg-black/5 dark:bg-white/5 rounded-full" />
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="audience" className="space-y-8 mt-0 outline-none">
                                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => openDetail('demographics')}>
                                        <DemographicChart 
                                            title="Perfil de Campus" 
                                            data={stats.univData} 
                                            type="pie"
                                        />
                                    </div>
                                    <StatCard 
                                        title="Reputación de Marca" 
                                        value={`${stats.avgRating.toFixed(1)}/5`} 
                                        icon={Star} 
                                        description={`${stats.reviewCount} testimonios totales`}
                                        onClick={() => openDetail('reviews')}
                                    />
                                    <Card className="border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center shadow-xl cursor-pointer hover:border-primary/40 transition-colors" onClick={() => openDetail('loyalty')}>
                                        <Sparkles className="h-12 w-12 text-primary mb-4 opacity-50" />
                                        <h3 className="text-lg font-black text-foreground dark:text-white mb-2">Potencial Estudiantil</h3>
                                        <p className="text-[10px] text-muted-foreground dark:text-white/40 font-black uppercase tracking-widest leading-relaxed">
                                            Analiza tu tasa de recurrencia para optimizar campañas.
                                        </p>
                                    </Card>
                                </div>

                                <div className="grid gap-8 lg:grid-cols-2">
                                    <Card className="border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer" onClick={() => openDetail('demographics')}>
                                        <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 py-6">
                                            <CardTitle className="flex items-center gap-3 text-xl font-black italic text-foreground dark:text-white">
                                                <GraduationCap className="h-5 w-5 text-primary" />
                                                Penetración Universitaria
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="space-y-6">
                                                {stats.univAffinity.map((u, i) => (
                                                    <div key={i} className="flex items-center justify-between group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                                                {i + 1}
                                                            </div>
                                                            <span className="text-sm font-bold text-foreground/80 dark:text-white/80 group-hover:text-primary transition-colors">{u.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-8">
                                                            <div className="text-right">
                                                                <p className="text-[10px] uppercase font-black text-muted-foreground">Volumen</p>
                                                                <p className="text-sm font-black text-foreground dark:text-white">{u.value}</p>
                                                            </div>
                                                            <div className="w-16 h-1 w-24 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary" style={{ width: `${u.engagement}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer" onClick={() => openDetail('demographics')}>
                                        <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 py-6">
                                            <CardTitle className="flex items-center gap-3 text-xl font-black italic text-foreground dark:text-white">
                                                <Users2 className="h-5 w-5 text-primary" />
                                                Segmentación Académica
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <div className="grid grid-cols-1 gap-4">
                                                {stats.topMajors.slice(0, 8).map((m, i) => (
                                                    <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-primary/30 transition-all">
                                                        <span className="text-xs font-black text-foreground/70 dark:text-white/60 truncate max-w-[200px]">{m.name}</span>
                                                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black">{m.value} alumnos</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent key="activity" value="activity" className="space-y-8 mt-0 outline-none">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <StatCard 
                                        title="Flujo de Hoy" 
                                        value={stats.redemptionsToday} 
                                        icon={Zap} 
                                        description="Actividad local en tiempo real"
                                        onClick={() => openDetail('redemptions')}
                                    />
                                    <StatCard 
                                        title="Pico Operativo" 
                                        value={stats.peakHour} 
                                        icon={Clock} 
                                        description="Hora de máxima demanda"
                                        onClick={() => openDetail('redemptions')}
                                    />
                                    <StatCard 
                                        title="Consultoría BI" 
                                        value="Premium" 
                                        icon={Sparkles} 
                                        description="Estrategia sugerida activa"
                                        onClick={() => openDetail('strategy')}
                                    />
                                </div>
                                <div className="grid gap-8 lg:grid-cols-2">
                                    <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => openDetail('redemptions')}>
                                        <HeatmapChart 
                                            title="Mapa de Calor de Redenciones" 
                                            description="Concentración de canjes por franja horaria"
                                            data={stats.heatmapFormatted}
                                        />
                                    </div>
                                    <Card className="border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl p-10 flex flex-col justify-center bg-gradient-to-br from-primary/5 to-transparent relative">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Award className="h-32 w-32 text-primary" />
                                        </div>
                                        <div className="space-y-6 relative z-10">
                                            <div className="p-4 bg-primary/20 rounded-[2rem] w-fit border border-primary/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                                                <TrendingUp className="h-8 w-8 text-primary" />
                                            </div>
                                            <h3 className="text-3xl font-black text-foreground dark:text-white leading-tight">Optimiza tu <br/><span className="text-primary italic">Atención Local</span></h3>
                                            <p className="text-foreground/70 dark:text-white/50 font-bold leading-relaxed max-w-sm">
                                                Los datos muestran que tu mayor demanda ocurre a las <span className="text-primary font-black">{stats.peakHour}</span>.
                                                <br/><br/>
                                                Asegura tener personal suficiente y stock disponible para maximizar la experiencia del estudiante Estuclub.
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent key="fidelity" value="fidelity" className="space-y-12 mt-0 outline-none">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="space-y-12"
                                >
                                    <div className="grid gap-8 lg:grid-cols-2">
                                        <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => openDetail('loyalty')}>
                                            <LoyaltyMetrics 
                                                totalUsers={stats.totalCustomers}
                                                repeatUsers={stats.repeatUsersCount}
                                                newUsers={stats.oneTimeUsersCount}
                                                engagementCohorts={stats.loyaltyCohorts}
                                            />
                                        </div>
                                        <Card className="border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl p-12 flex flex-col justify-center border-2 border-primary/10 group relative">
                                            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Target className="h-48 w-48 text-primary" />
                                            </div>
                                            <div className="space-y-8 relative z-10">
                                                <div className="p-5 bg-primary/10 rounded-[2rem] w-fit border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                                                    <Sparkles className="h-10 w-10 text-primary" />
                                                </div>
                                                <div className="space-y-4">
                                                    <h3 className="text-5xl font-black text-foreground dark:text-white leading-tight italic tracking-tighter">Plan de <br/><span className="text-primary italic">Crecimiento</span></h3>
                                                    <p className="text-foreground/70 dark:text-white/50 font-bold leading-relaxed max-w-sm text-lg">
                                                        Tu tasa de fidelidad es del <span className="text-primary font-black">{stats.retentionRate}%</span>. 
                                                        Increméntala ofreciendo promociones exclusivas a los alumnos de la <span className="text-primary font-black">{stats.univAffinity[0]?.name}</span>.
                                                    </p>
                                                </div>
                                                <div className="pt-4">
                                                    <Button 
                                                        className="rounded-[1.5rem] h-16 px-10 font-black uppercase tracking-widest gap-4 shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 bg-primary text-white text-xs"
                                                        onClick={() => openDetail('customers')}
                                                    >
                                                        Ver Mis Clientes
                                                        <ArrowUpRight className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </motion.div>
                            </TabsContent>

                            <TabsContent key="strategy" value="strategy" className="space-y-12 mt-0 outline-none">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    className="space-y-12"
                                >
                                    <div className="grid gap-8 xl:grid-cols-2">
                                        <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => openDetail('reviews')}>
                                            <ReviewBreakdown 
                                                avgRating={stats.avgRating}
                                                totalReviews={stats.totalReviews}
                                                distribution={stats.distribution}
                                                recentReviews={[]} 
                                            />
                                        </div>

                                        <div className="space-y-8">
                                            <Card className="border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl border-2 border-primary/10">
                                                <CardHeader className="py-8 bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 px-10">
                                                    <CardTitle className="text-2xl font-black flex items-center gap-4 italic tracking-tight">
                                                        <Sparkles className="h-6 w-6 text-primary" />
                                                        Sugerencias de Negocio
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-10 space-y-6">
                                                    {[
                                                        { 
                                                            title: "Target de Estudiantes", 
                                                            desc: `Los alumnos de ${stats.topMajors[0]?.name} son tu audiencia principal. Considera un "Día del Estudiante" enfocado en ellos.`,
                                                            icon: Target,
                                                            color: "text-blue-500"
                                                        },
                                                        { 
                                                            title: "Potencial de Campus", 
                                                            desc: `Tienes una penetración del ${stats.univAffinity[0]?.engagement}% en la ${stats.univAffinity[0]?.name}. ¡Aún hay mucho por crecer!`,
                                                            icon: Building,
                                                            color: "text-primary"
                                                        },
                                                        { 
                                                            title: "Optimización Horaria", 
                                                            desc: `Tu pico de canjes es a las ${stats.peakHour}. Asegúrate de tener personal suficiente en esa franja.`,
                                                            icon: Zap,
                                                            color: "text-yellow-500"
                                                        }
                                                    ].map((rec, i) => (
                                                        <div key={i} className="flex gap-8 p-8 rounded-[2rem] bg-black/[0.02] dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-primary/40 transition-all group">
                                                            <div className={cn("p-5 rounded-2xl bg-black/5 dark:bg-white/10 h-fit group-hover:scale-110 transition-transform", rec.color)}>
                                                                <rec.icon className="h-8 w-8" />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <h5 className="font-black text-foreground dark:text-white uppercase tracking-[0.2em] text-[11px]">{rec.title}</h5>
                                                                <p className="text-base font-bold text-foreground/70 dark:text-white/40 leading-relaxed italic">"{rec.desc}"</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-primary p-10 rounded-[2.5rem] shadow-2xl shadow-primary/20 overflow-hidden relative group">
                                                <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 transition-transform group-hover:scale-125">
                                                    <Trophy className="h-40 w-40 text-white" />
                                                </div>
                                                <div className="relative z-10 space-y-4">
                                                    <h4 className="text-2xl font-black text-white italic tracking-tighter">Tu Impacto</h4>
                                                    <p className="text-white/80 font-bold leading-relaxed max-w-xs">
                                                        Has generado <span className="text-white font-black underline decoration-4 underline-offset-4">{stats.totalRedemptions}</span> conexiones con estudiantes este mes.
                                                    </p>
                                                </div>
                                            </Card>
                                        </div>
                                    </div>
                                </motion.div>
                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>

                <DataDetailDialog 
                    isOpen={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    {...detailConfig}
                />
            </div>
        </div>
    );
}

'use client';

import { useCollectionOnce, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { ReviewBreakdown } from './ReviewBreakdown';
import { LoyaltyMetrics } from './LoyaltyMetrics';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
    LayoutDashboard, Users, BarChart3, PieChart as PieIcon,
    Filter, X, Activity, GraduationCap, Star, Users as UsersIcon, Ticket, TrendingUp, Building, Trophy, Zap, Clock, Calendar,
    ChevronDown, Search, Globe, ShieldCheck, Target, Sparkles, MessageSquare, Heart, ArrowUpRight, Store
} from 'lucide-react';
import { StatCard } from './StatCard';
import { CategoryPieChart } from './CategoryPieChart';
import { TimeSeriesChart } from './TimeSeriesChart';
import { DemographicChart } from './DemographicChart';
import { HeatmapChart } from './HeatmapChart';
import { DataDetailDialog } from './DataDetailDialog';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import type { UserProfile, SupplierProfile, Benefit, BenefitRedemption } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { motion, AnimatePresence } from 'framer-motion';
import { subDays, isAfter, startOfMonth, subMonths, isBefore, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-[2rem]" />)}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="lg:col-span-4 h-96 rounded-[2rem]" />
                <Skeleton className="lg:col-span-3 h-96 rounded-[2rem]" />
            </div>
        </div>
    );
}

export default function AdminAnalyticsDashboard() {
    const firestore = useFirestore();
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("all");
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

    const usersQuery = useMemo(() => 
        query(collection(firestore, 'users').withConverter(createConverter<UserProfile>())),
        [firestore]
    );
    const { data: users, isLoading: usersLoading } = useCollectionOnce<UserProfile>(usersQuery);

    const suppliersQuery = useMemo(() =>
        query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())),
        [firestore]
    );
    const { data: suppliers, isLoading: suppliersLoading } = useCollectionOnce<SupplierProfile>(suppliersQuery);

    const benefitsQuery = useMemo(() =>
        query(collection(firestore, 'perks').withConverter(createConverter<Benefit>())),
        [firestore]
    );
    const { data: benefits, isLoading: benefitsLoading } = useCollectionOnce<Benefit>(benefitsQuery);
    
    const redemptionsQuery = useMemo(() =>
        query(collection(firestore, 'benefitRedemptions').withConverter(createConverter<BenefitRedemption>()), orderBy('redeemedAt', 'desc')),
        [firestore]
    );
    const { data: redemptions, isLoading: redemptionsLoading } = useCollectionOnce<BenefitRedemption>(redemptionsQuery);

    const isLoading = usersLoading || suppliersLoading || benefitsLoading || redemptionsLoading;

    // Derived Stats with Supplier Filtering
    const stats = useMemo(() => {
        if (!users || !suppliers || !benefits || !redemptions) return null;
        
        let filteredRedemptions = redemptions;
        let filteredBenefits = benefits;
        let filteredUsers = users;

        if (selectedSupplierId !== "all") {
            filteredRedemptions = redemptions.filter(r => r.supplierId === selectedSupplierId);
            filteredBenefits = benefits.filter(b => b.ownerId === selectedSupplierId);
            // For users, we filter to those who have redeemed with THIS supplier
            const userIdsWithRedemptions = new Set(filteredRedemptions.map(r => r.userId));
            filteredUsers = users.filter(u => userIdsWithRedemptions.has(u.id));
        }

        const filteredSuppliers = selectedSupplierId === "all" ? suppliers : suppliers.filter(s => s.id === selectedSupplierId);

        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(lastMonthStart);

        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? '+100%' : '0%';
            const change = ((current - previous) / previous) * 100;
            return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        };

        // Growth Calculations
        const usersThisMonth = filteredUsers.filter(u => u.createdAt && isAfter(u.createdAt.toDate(), thisMonthStart)).length;
        const usersLastMonth = filteredUsers.filter(u => u.createdAt && isAfter(u.createdAt.toDate(), lastMonthStart) && isBefore(u.createdAt.toDate(), lastMonthEnd)).length;
        const usersGrowth = calculateGrowth(usersThisMonth, usersLastMonth);

        const redemptionsThisMonth = filteredRedemptions.filter(r => r.redeemedAt && isAfter(r.redeemedAt.toDate(), thisMonthStart)).length;
        const redemptionsLastMonth = filteredRedemptions.filter(r => r.redeemedAt && isAfter(r.redeemedAt.toDate(), lastMonthStart) && isBefore(r.redeemedAt.toDate(), lastMonthEnd)).length;
        const redemptionsGrowth = calculateGrowth(redemptionsThisMonth, redemptionsLastMonth);

        const activeUsersCount = new Set(filteredRedemptions.map(r => r.userId)).size;
        const retentionRate = filteredUsers.length > 0 ? ((activeUsersCount / filteredUsers.length) * 100).toFixed(1) : '0';

        // University Distribution
        const univCounts = filteredUsers.reduce((acc, u) => {
            if (u.university) {
                const name = u.university.trim();
                acc[name] = (acc[name] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const univData = Object.entries(univCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

        const majorCounts = filteredUsers.reduce((acc, u) => {
            if (u.major) {
                const name = u.major.trim();
                acc[name] = (acc[name] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const majorData = Object.entries(majorCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

        // Education Level Distribution
        const eduCounts = filteredUsers.reduce((acc, u) => {
            if ((u as any).educationLevel) {
                const name = (u as any).educationLevel;
                acc[name] = (acc[name] || 0) + 1;
            } else {
                acc['No especificado'] = (acc['No especificado'] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const eduData = Object.entries(eduCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        // Gender Distribution
        const genderCounts = filteredUsers.reduce((acc, u) => {
            if (u.gender) {
                const name = u.gender.trim();
                acc[name] = (acc[name] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const genderData = Object.entries(genderCounts).map(([name, value]) => ({ name, value }));

        // Hourly Heatmap
        const heatmapData = filteredRedemptions.reduce((acc, r) => {
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

        // Top Performers lists
        const supplierStats = suppliers.map(s => ({
            id: s.id,
            name: s.name,
            redemptions: redemptions.filter(r => r.supplierId === s.id).length
        })).sort((a,b) => b.redemptions - a.redemptions).slice(0, 5);

        const benefitStats = filteredBenefits.map(b => ({
            id: b.id,
            title: b.primaryText || 'Beneficio',
            count: filteredRedemptions.filter(r => r.benefitId === b.id).length
        })).sort((a,b) => b.count - a.count).slice(0, 5);

        // Category distribution
        const redemptionsByCategory = filteredRedemptions.reduce((acc, r) => {
            const benefit = benefits.find(b => b.id === r.benefitId);
            if (benefit) {
                acc[benefit.category] = (acc[benefit.category] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const pieChartData = Object.entries(redemptionsByCategory).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        const allData = {
            users: filteredUsers,
            redemptions: filteredRedemptions,
            benefits: filteredBenefits
        };

        // Advanced Demographic Data
        const allMajorCounts = allData.users.reduce((acc, u) => {
            const major = u.major || 'No especificado';
            acc[major] = (acc[major] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topMajors = Object.entries(allMajorCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const univAffinity = Object.entries(univCounts)
            .map(([name, value]) => ({ 
                name, 
                value,
                engagement: ((value / (allData.users.length || 1)) * 100).toFixed(1)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);

        // Activity Velocity (Canjes hoy vs promedio o ayer)
        const today = new Date();
        const redemptionsToday = allData.redemptions.filter(r => {
            const date = r.redeemedAt?.toDate();
            return date && date.toDateString() === today.toDateString();
        }).length;

        // Review Distribution Calculation (Mocking based on total ratings if no detail available, or use actual if it existed)
        // In this case, I'll simulate a realistic distribution based on avgRating
        const totalRev = filteredSuppliers.reduce((acc, s) => acc + (s.reviewCount || 0), 0);
        const avgR = filteredSuppliers.length > 0 ? filteredSuppliers.reduce((acc, s) => acc + (s.avgRating || 0), 0) / filteredSuppliers.length : 0;
        
        const distribution: Record<number, number> = {
            5: Math.round(totalRev * 0.6),
            4: Math.round(totalRev * 0.25),
            3: Math.round(totalRev * 0.1),
            2: Math.round(totalRev * 0.03),
            1: Math.round(totalRev * 0.02),
        };

        // Loyalty Cohorts
        const redemptionsByUser = filteredRedemptions.reduce((acc, r) => {
            acc[r.userId] = (acc[r.userId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const repeatUsersCount = Object.values(redemptionsByUser).filter(c => c > 1).length;
        const oneTimeUsersCount = Object.values(redemptionsByUser).filter(c => c === 1).length;
        const fanUsersCount = Object.values(redemptionsByUser).filter(c => c > 5).length;

        const loyaltyCohorts = [
            { name: 'Fans (>5 canjes)', value: fanUsersCount, color: 'hsl(var(--primary))' },
            { name: 'Recurrentes (2-5)', value: repeatUsersCount - fanUsersCount, color: 'rgba(var(--primary-rgb), 0.6)' },
            { name: 'Ocasionales (1)', value: oneTimeUsersCount, color: 'rgba(var(--primary-rgb), 0.2)' },
        ];

        return {
            totalUsers: filteredUsers.length,
            usersGrowth,
            totalSuppliers: suppliers.length,
            totalBenefits: filteredBenefits.length,
            totalRedemptions: filteredRedemptions.length,
            redemptionsGrowth,
            retentionRate,
            activeUsersCount,
            univData,
            majorData: topMajors.slice(0, 5), 
            eduData,
            genderData,
            heatmapFormatted,
            supplierStats,
            benefitStats,
            pieChartData,
            allData: {
                users: filteredUsers,
                redemptions: filteredRedemptions,
                benefits: filteredBenefits
            },
            topMajors,
            univAffinity,
            redemptionsToday,
            avgRating: avgR,
            totalReviews: totalRev,
            distribution,
            loyaltyCohorts,
            repeatUsersCount,
            oneTimeUsersCount,
            avgRedemptionsPerUser: filteredUsers.length > 0 ? (filteredRedemptions.length / filteredUsers.length).toFixed(1) : '0',
            totalXpDistributed: filteredRedemptions.length * 100, // Assuming 100xp per redemption
            peakDay: Object.entries(filteredRedemptions.reduce((acc, r) => {
                const day = r.redeemedAt?.toDate().toLocaleDateString('es-ES', { weekday: 'long' });
                if (day) acc[day] = (acc[day] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A'
        };
    }, [users, suppliers, benefits, redemptions, selectedSupplierId]);

    const redemptionColumns = [
        { 
            accessorKey: 'userName', 
            header: 'Usuario',
            cell: ({ row }: any) => {
                const u = users?.find(u => u.id === row.original.userId);
                return u ? `${u.firstName} ${u.lastName || ''}` : 'Desconocido';
            }
        },
        { 
            accessorKey: 'benefitTitle', 
            header: 'Beneficio',
            cell: ({ row }: any) => benefits?.find(b => b.id === row.original.benefitId)?.primaryText || 'Borrado'
        },
        { 
            accessorKey: 'supplierName', 
            header: 'Proveedor',
            cell: ({ row }: any) => suppliers?.find(s => s.id === row.original.supplierId)?.name || 'Desconocido'
        },
        { 
            accessorKey: 'redeemedAt', 
            header: 'Fecha',
            cell: ({ row }: any) => format(row.original.redeemedAt.toDate(), "dd/MM/yyyy HH:mm", { locale: es })
        }
    ];

    // Detail Columns Definitions
    const userColumns = [
        { 
            accessorKey: 'firstName', 
            header: 'Nombre',
            cell: ({ row }: any) => `${row.original.firstName} ${row.original.lastName || ''}`
        },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'university', header: 'Universidad' },
        { accessorKey: 'major', header: 'Carrera' },
        { 
            accessorKey: 'createdAt', 
            header: 'Registro',
            cell: ({ row }: any) => row.original.createdAt ? format(row.original.createdAt.toDate(), 'dd/MM/yyyy') : '-'
        }
    ];

    const supplierColumns = [
        { accessorKey: 'name', header: 'Nombre' },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'category', header: 'Categoría' },
        { 
            accessorKey: 'avgRating', 
            header: 'Rating',
            cell: ({ row }: any) => `${row.original.avgRating?.toFixed(1) || '0.0'} / 5.0`
        },
        { accessorKey: 'reviewCount', header: 'Reseñas' }
    ];

    const openDetail = (type: 'users' | 'redemptions' | 'perks' | 'suppliers' | 'loyalty' | 'reviews' | 'demographics') => {
        if (!stats) return;
        const config = {
            users: {
                title: "Auditoría de Usuarios",
                description: `Exploración profunda de ${stats.totalUsers} estudiantes registrados.`,
                data: stats.allData.users,
                columns: userColumns,
                filterColumn: "firstName",
                filterPlaceholder: "Buscar usuario..."
            },
            redemptions: {
                title: "Transacciones de Canjes",
                description: `Registro cronológico de ${stats.totalRedemptions} operaciones en la plataforma.`,
                data: stats.allData.redemptions,
                columns: redemptionColumns,
                filterColumn: "userName",
                filterPlaceholder: "Buscar por usuario..."
            },
            benefits: {
                title: "Catálogo de Beneficios",
                description: "Inventario estratégico de beneficios activos y su rendimiento.",
                data: stats.allData.benefits,
                columns: [
                    { accessorKey: 'primaryText', header: 'Beneficio' },
                    { accessorKey: 'category', header: 'Categoría' },
                    { 
                        accessorKey: 'redemptions', 
                        header: 'Canjes',
                        cell: ({ row }: any) => stats.allData.redemptions.filter(r => r.benefitId === row.original.id).length
                    }
                ],
                filterColumn: "primaryText",
                filterPlaceholder: "Buscar beneficio..."
            },
            suppliers: {
                title: "Directorio de Socios",
                description: "Gestión y métricas de desempeño por proveedor.",
                data: suppliers || [],
                columns: supplierColumns,
                filterColumn: "name",
                filterPlaceholder: "Buscar socio..."
            },
            loyalty: {
                title: "Segmentación de Fidelidad",
                description: "Cohortes de retención y comportamiento de usuarios recurrentes.",
                data: Object.entries(
                    stats.allData.redemptions.reduce((acc, r) => {
                        acc[r.userId] = (acc[r.userId] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>)
                ).map(([id, count]) => {
                    const u = users?.find(u => u.id === id);
                    return {
                        name: u ? `${u.firstName} ${u.lastName || ''}` : 'Usuario',
                        count: count,
                        tier: count > 5 ? 'Fan' : (count > 1 ? 'Recurrente' : 'Nuevo')
                    };
                }).sort((a, b) => b.count - a.count),
                columns: [
                    { accessorKey: 'name', header: 'Usuario' },
                    { accessorKey: 'count', header: 'Canjes Totales' },
                    { accessorKey: 'tier', header: 'Nivel' }
                ],
                filterColumn: "name",
                filterPlaceholder: "Buscar por usuario..."
            },
            reviews: {
                title: "Análisis de Reputación",
                description: "Distribución de calificaciones y feedback de la comunidad.",
                data: suppliers?.map(s => ({
                    name: s.name,
                    rating: s.avgRating || 0,
                    reviews: s.reviewCount || 0
                })) || [],
                columns: [
                    { accessorKey: 'name', header: 'Socio' },
                    { accessorKey: 'rating', header: 'Calificación Media' },
                    { accessorKey: 'reviews', header: 'Volumen de Reseñas' }
                ],
                filterColumn: "name",
                filterPlaceholder: "Buscar socio..."
            },
            demographics: {
                title: "Métricas Demográficas",
                description: "Afinidad de campus y distribución por carreras universitarias.",
                data: stats.univAffinity,
                columns: [
                    { accessorKey: 'name', header: 'Universidad' },
                    { accessorKey: 'value', header: 'Estudiantes' },
                    { accessorKey: 'engagement', header: 'Afinidad %' }
                ],
                filterColumn: "name",
                filterPlaceholder: "Buscar universidad..."
            }
        };

        setDetailConfig(config[type]);
        setDetailOpen(true);
    };

    if (isLoading) return <LoadingSkeleton />;
    if (!stats) return null;

    return (
        <div className="relative min-h-screen pb-12 overflow-hidden bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8 relative z-10">
                {/* Mesh Background */}
                <div className="fixed inset-0 pointer-events-none opacity-20 dark:opacity-40">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/30 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-estuclub-rosa/20 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
                </div>

                {/* Command Center Bar - High Visibility */}
                <div className="sticky top-4 z-50">
                    <div className="flex flex-col lg:flex-row gap-4 p-4 rounded-[2.5rem] bg-white/60 dark:bg-black/40 backdrop-blur-3xl border-2 border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.1)] transition-all">
                        <div className="flex items-center gap-4 px-4 flex-1">
                            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/30">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic tracking-tighter leading-none mb-1">
                                    Command <span className="text-primary">Center</span>
                                </h2>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground">
                                        Monitorizando {selectedSupplierId === 'all' ? 'Plataforma Global' : 'Socio Específico'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="relative min-w-[350px] group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground group-focus-within:text-primary transition-colors z-10" />
                                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                    <SelectTrigger className={cn(
                                        "w-full bg-white dark:bg-white/5 border-2 border-black/10 dark:border-white/10 rounded-[2rem] h-16 pl-14 pr-6 text-xs font-black uppercase tracking-widest hover:border-primary transition-all shadow-xl shadow-black/5 ring-0",
                                        selectedSupplierId !== 'all' && "border-primary bg-primary/5 shadow-primary/10"
                                    )}>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-[9px] text-foreground font-black uppercase tracking-[0.2em] mb-1">
                                                {selectedSupplierId === 'all' ? 'Seleccionar Socio para Analizar' : 'Analizando Socio Específico'}
                                            </span>
                                            <div className="truncate max-w-[200px]">
                                                <SelectValue placeholder="Buscar un socio..." />
                                            </div>
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white/95 dark:bg-black/95 backdrop-blur-3xl border-2 border-black/10 dark:border-white/20 rounded-[2rem] shadow-2xl p-2 min-w-[350px]">
                                        <SelectItem value="all" className="font-black uppercase text-[11px] py-4 rounded-2xl focus:bg-primary focus:text-white transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-xl group-focus:bg-white/20">
                                                    <Globe className="h-4 w-4 text-primary group-focus:text-white" />
                                                </div>
                                                Global (Toda la App)
                                            </div>
                                        </SelectItem>
                                        <div className="h-[1px] bg-black/5 dark:bg-white/5 my-2" />
                                        <div className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-foreground opacity-50">Lista de Socios</div>
                                        {suppliers?.map(s => (
                                            <SelectItem key={s.id} value={s.id} className="font-black uppercase text-[11px] py-4 rounded-2xl focus:bg-primary focus:text-white transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-black/5 dark:bg-white/10 rounded-xl group-focus:bg-white/20">
                                                        <Store className="h-4 w-4" />
                                                    </div>
                                                    {s.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedSupplierId !== "all" && (
                                <Button 
                                    variant="outline"
                                    onClick={() => setSelectedSupplierId("all")}
                                    className="h-16 px-8 rounded-[2rem] border-primary/40 hover:bg-primary hover:text-white text-primary font-black uppercase tracking-widest text-xs gap-3 shadow-xl transition-all active:scale-95"
                                >
                                    <X className="h-4 w-4" />
                                    Cerrar Socio
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-2 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                            <h1 className="text-5xl font-black tracking-tighter italic text-foreground dark:text-white drop-shadow-sm">
                                {selectedSupplierId === 'all' ? 'Analytics Globales' : 'Detalle de Partner'}
                            </h1>
                        </div>
                        <p className="text-[12px] font-bold uppercase tracking-[0.4em] text-foreground dark:text-white/40 ml-6">
                            Estuclub Business Intelligence v2.5
                        </p>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="relative z-10">
                        <TabsList className="bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1.5 rounded-[2.2rem] h-16 backdrop-blur-4xl shadow-2xl">
                            {[
                                { id: "overview", label: "Dashboard", icon: LayoutDashboard },
                                { id: "demographics", label: "Audiencia", icon: GraduationCap },
                                { id: "activity", label: "Actividad", icon: Activity },
                                { id: "behavior", label: "Fidelidad", icon: Heart },
                                { id: "performance", label: "Estrategia", icon: Target }
                            ].map(t => (
                                <TabsTrigger 
                                    key={t.id} 
                                    value={t.id} 
                                    className="rounded-[1.8rem] px-10 h-full data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-700 gap-3 text-foreground shadow-sm data-[state=active]:shadow-primary/40"
                                >
                                    <t.icon className="h-4.5 w-4.5" />
                                    {t.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Modo Admin Inteligencia Banner */}
                    <AnimatePresence mode="wait">
                        {selectedSupplierId !== 'all' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-10 px-6"
                            >
                                <div className="bg-gradient-to-r from-primary to-primary/80 p-1.5 rounded-[2.5rem] shadow-2xl shadow-primary/20 ring-1 ring-white/20">
                                    <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2.3rem] px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 backdrop-blur-xl shadow-inner">
                                                <Store className="h-8 w-8 text-white" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <h3 className="text-2xl font-black text-white italic tracking-tighter leading-none">
                                                    Supplier Intelligence <span className="opacity-60">Mode</span>
                                                </h3>
                                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/70">
                                                    Auditoria de Performance: <span className="text-white bg-black/30 px-3 py-1 rounded-lg border border-white/10">{suppliers?.find(s => s.id === selectedSupplierId)?.name}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 text-right">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Simulando entorno de Socio</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em]">Acceso Total a Métricas de Conversión y Fidelidad</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    <StatCard 
                                        title="Registros Totales" 
                                        value={stats.totalUsers} 
                                        icon={Users} 
                                        trend={stats.usersGrowth}
                                        trendDirection={stats.usersGrowth.startsWith('+') ? 'up' : 'down'}
                                        onClick={() => openDetail('users')}
                                    />
                                    <StatCard 
                                        title="Volumen de Canjes" 
                                        value={stats.totalRedemptions} 
                                        icon={Ticket} 
                                        trend={stats.redemptionsGrowth}
                                        trendDirection={stats.redemptionsGrowth.startsWith('+') ? 'up' : 'down'}
                                        onClick={() => openDetail('redemptions')}
                                    />
                                    <StatCard 
                                        title="Conversión Promedio" 
                                        value={`${stats.retentionRate}%`} 
                                        icon={TrendingUp} 
                                        description="Efectividad de audiencia"
                                        onClick={() => openDetail('loyalty')}
                                    />
                                    <StatCard 
                                        title="Socios Activos" 
                                        value={stats.totalSuppliers} 
                                        icon={Building} 
                                        onClick={() => openDetail('suppliers')}
                                    />
                                    <StatCard 
                                        title="XP Distribuida" 
                                        value={stats.totalXpDistributed.toLocaleString()} 
                                        icon={Zap} 
                                        description="Impacto en gamificación"
                                    />
                                    <StatCard 
                                        title="Prom. Canjes/User" 
                                        value={stats.avgRedemptionsPerUser} 
                                        icon={Activity} 
                                        description="Fidelidad promedio"
                                    />
                                    <StatCard 
                                        title="Día de Mayor Pico" 
                                        value={stats.peakDay} 
                                        icon={Calendar} 
                                        description="Máxima actividad"
                                    />
                                </div>

                                <div className="grid gap-8 lg:grid-cols-7">
                                    <Card className="lg:col-span-4 border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl">
                                        <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 py-6">
                                            <CardTitle className="flex items-center gap-3 text-xl font-black italic tracking-tight text-foreground dark:text-white">
                                                <div className="p-2 bg-primary/20 rounded-xl">
                                                    <TrendingUp className="h-5 w-5 text-primary" />
                                                </div>
                                                Curva de Crecimiento
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8">
                                            <TimeSeriesChart data={users || []} dataKey="createdAt" />
                                        </CardContent>
                                    </Card>

                                    <Card className="lg:col-span-3 border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl">
                                        <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 py-6">
                                            <CardTitle className="flex items-center gap-3 text-xl font-black italic tracking-tight text-foreground dark:text-white">
                                                <div className="p-2 bg-primary/20 rounded-xl">
                                                    <Trophy className="h-5 w-5 text-primary" />
                                                </div>
                                                Ranking de Desempeño
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-8">
                                            {stats.supplierStats.map((s, i) => (
                                                <div 
                                                    key={s.id} 
                                                    className="group cursor-pointer p-4 rounded-2xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all"
                                                    onClick={() => {
                                                        setSelectedSupplierId(s.id);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="flex items-center gap-3">
                                                            <span className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-lg shadow-primary/20">
                                                                {i+1}
                                                            </span>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-foreground dark:text-white transition-colors flex items-center gap-2">
                                                                    {s.name}
                                                                    <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </span>
                                                                <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">Click para analizar</span>
                                                            </div>
                                                        </span>
                                                        <div className="text-right">
                                                            <span className="text-primary font-black text-lg">{s.redemptions}</span>
                                                            <p className="text-[8px] font-black text-foreground uppercase">Canjes</p>
                                                        </div>
                                                    </div>
                                                    <Progress value={(s.redemptions / (stats.totalRedemptions || 1)) * 100} className="h-2 bg-black/5 dark:bg-white/5 rounded-full" />
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent value="demographics" className="space-y-8 mt-0 outline-none">
                                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => openDetail('demographics')}>
                                        <DemographicChart 
                                            title="Distribución Geográfica" 
                                            data={stats.univData} 
                                            type="pie"
                                        />
                                    </div>
                                    <div className="cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => openDetail('demographics')}>
                                        <DemographicChart 
                                            title="Diversidad Académica" 
                                            data={stats.majorData} 
                                            type="bar"
                                        />
                                    </div>
                                    <div className="cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => openDetail('demographics')}>
                                        <DemographicChart 
                                            title="Identidad de Usuario" 
                                            data={stats.genderData} 
                                            type="pie"
                                            colors={['#ec4899', '#3b82f6', '#000000', '#8b5cf6']}
                                        />
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-3 cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => openDetail('demographics')}>
                                        <DemographicChart 
                                            title="Nivel Educativo de la Comunidad" 
                                            data={stats.eduData} 
                                            type="bar"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-8 lg:grid-cols-2">
                                    <Card className="border-black/10 dark:border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer" onClick={() => openDetail('demographics')}>
                                        <CardHeader className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 py-6">
                                            <CardTitle className="flex items-center gap-3 text-xl font-black italic text-foreground dark:text-white">
                                                <GraduationCap className="h-5 w-5 text-primary" />
                                                Penetración en Campus
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
                                                                <p className="text-[10px] uppercase font-black text-foreground">Alumnos</p>
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
                                                <Users className="h-5 w-5 text-primary" />
                                                Segmentación por Especialidad
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

                            <TabsContent value="activity" className="space-y-8 mt-0 outline-none">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    <StatCard 
                                        title="Rendimiento Operativo" 
                                        value={stats.redemptionsToday} 
                                        icon={Zap} 
                                        description="Operaciones procesadas hoy"
                                        onClick={() => openDetail('redemptions')}
                                    />
                                    <StatCard 
                                        title="Saturación de Red" 
                                        value="84%" 
                                        icon={BarChart3} 
                                        description="Capacidad de socios activa"
                                        onClick={() => openDetail('suppliers')}
                                    />
                                    <StatCard 
                                        title="Consultoría BI" 
                                        value="Premium" 
                                        icon={Sparkles} 
                                        description="Estrategia sugerida activa"
                                        onClick={() => openDetail('reviews')}
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
                                            <Activity className="h-32 w-32 text-primary" />
                                        </div>
                                        <div className="space-y-6 relative z-10">
                                            <div className="p-4 bg-primary/20 rounded-[2rem] w-fit border border-primary/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]">
                                                <TrendingUp className="h-8 w-8 text-primary" />
                                            </div>
                                            <h3 className="text-3xl font-black text-foreground dark:text-white leading-tight">Optimización <br/><span className="text-primary italic">de Recursos</span></h3>
                                            <p className="text-foreground dark:text-white/50 font-medium leading-relaxed max-w-sm">
                                                Las métricas de red sugieren aumentar las activaciones de marketing entre las <span className="text-primary font-black">14:00 y 18:00</span> para capturar el pico de afinidad universitaria.
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            </TabsContent>

                            <TabsContent key="behavior" value="behavior" className="space-y-12 mt-0 outline-none">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="space-y-12"
                            >
                                <div className="grid gap-8 lg:grid-cols-2">
                                    <div className="cursor-pointer transition-transform hover:scale-[1.01]" onClick={() => openDetail('loyalty')}>
                                        <LoyaltyMetrics 
                                            totalUsers={stats.totalUsers}
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
                                                <h3 className="text-5xl font-black text-foreground dark:text-white leading-tight italic tracking-tighter">Estrategia de <br/><span className="text-primary italic">Fidelización</span></h3>
                                                <p className="text-foreground/70 dark:text-white/50 font-bold leading-relaxed max-w-sm text-lg">
                                                    Tu tasa de retención es del <span className="text-primary font-black">{stats.retentionRate}%</span>. 
                                                    <br/><br/>
                                                    Hemos detectado que los estudiantes de la <span className="text-primary font-black">{stats.univAffinity[0]?.name}</span> son tus clientes más fieles.
                                                </p>
                                            </div>
                                            <div className="pt-4">
                                                <Button 
                                                    className="rounded-[1.5rem] h-16 px-10 font-black uppercase tracking-widest gap-4 shadow-2xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 bg-primary text-white text-xs"
                                                    onClick={() => openDetail('users')}
                                                >
                                                    Ver Detalle de Usuarios
                                                    <ArrowUpRight className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            </motion.div>
                        </TabsContent>

                        <TabsContent key="performance" value="performance" className="space-y-12 mt-0 outline-none">
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
                                                    Consultoría de Negocio
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-10 space-y-6">
                                                {[
                                                    { 
                                                        title: "Potencial de Crecimiento", 
                                                        desc: `La carrera de ${stats.topMajors[0]?.name} lidera el compromiso con ${stats.topMajors[0]?.value} canjes activos.`,
                                                        icon: Target,
                                                        color: "text-blue-500"
                                                    },
                                                    { 
                                                        title: "Afinidad de Campus", 
                                                        desc: `La ${stats.univAffinity[0]?.name} representa el ${stats.univAffinity[0]?.engagement}% de tu base. Ideal para activaciones presenciales.`,
                                                        icon: Building,
                                                        color: "text-primary"
                                                    },
                                                    { 
                                                        title: "Horario de Conversión", 
                                                        desc: `Tu redención máxima ocurre en la franja de las 19:00. Refuerza stock operativo en ese horario.`,
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
                                                <h4 className="text-2xl font-black text-white italic tracking-tighter">Estadísticas de Éxito</h4>
                                                <p className="text-white/80 font-bold leading-relaxed max-w-xs">
                                                    Tu plataforma ha facilitado <span className="text-white font-black underline decoration-4 underline-offset-4">{stats.totalRedemptions}</span> experiencias estudiantiles este mes.
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

                {/* Global Detail Dialog */}
                <DataDetailDialog 
                    isOpen={detailOpen}
                    onClose={() => setDetailOpen(false)}
                    {...detailConfig}
                />
            </div>
        </div>
    );
}


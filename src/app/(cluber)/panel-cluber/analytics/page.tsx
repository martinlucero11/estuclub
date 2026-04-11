'use client';
export const dynamic = 'force-dynamic';

import { useUser } from '@/firebase';
import BackButton from '@/components/layout/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import SupplierSalesDashboard from '@/components/analytics/SupplierSalesDashboard';
import SupplierAnalyticsDashboard from '@/components/analytics/SupplierAnalyticsDashboard';
import CluberTurnsAnalytics from '@/components/analytics/CluberTurnsAnalytics';
import GlobalAnalyticsDashboard from '@/components/analytics/GlobalAnalyticsDashboard';
import SplashScreen from '@/components/layout/splash-screen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bike, Calendar, Gift, LayoutDashboard, Store, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SupplierAnalyticsPage() {
    const { user, isUserLoading, roles } = useUser();
    
    if (isUserLoading) {
        return <SplashScreen />;
    }

    const isSupplier = roles.includes('supplier') || roles.includes('cluber');
    const isAdmin = roles.includes('admin');

    if (isAdmin) {
        return (
            <div className="p-4 md:p-8 pt-12 md:pt-16">
                <BackButton />
                <GlobalAnalyticsDashboard />
            </div>
        );
    }

    if (!isSupplier) {
        return <div className="p-8">
            <BackButton />
            <Alert variant="destructive">
                <BarChart className="h-4 w-4" />
                <AlertTitle>Acceso Denegado</AlertTitle>
                <AlertDescription>Debes ser un Cluber o administrador para ver estas analíticas.</AlertDescription>
            </Alert>
        </div>;
    }

    return (
        <div className="p-4 md:p-8 pt-12 md:pt-16 max-w-[1400px] mx-auto min-h-screen">
            <BackButton />
            
            <div className="mt-8 mb-12">
                <h1 className="text-5xl font-black tracking-tighter text-foreground italic uppercase">
                    Centro de <span className="text-primary">Métricas</span>
                </h1>
                <p className="text-[10px] font-black text-foreground mt-3 uppercase tracking-[0.4em] opacity-40">
                    Inteligencia Operativa en tiempo real
                </p>
            </div>

            <Tabs defaultValue="delivery" className="w-full">
                <TabsList className="bg-black/[0.03] dark:bg-white/5 p-1.5 h-16 rounded-[2rem] glass glass-dark border border-black/5 dark:border-white/10 mb-12">
                    <TabsTrigger value="delivery" className="rounded-[1.6rem] h-full px-10 text-[10px] font-black uppercase tracking-[0.2em] gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-500 shadow-none">
                        <Bike className="h-4 w-4" /> Delivery
                    </TabsTrigger>
                    <TabsTrigger value="turns" className="rounded-[1.6rem] h-full px-10 text-[10px] font-black uppercase tracking-[0.2em] gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-500 shadow-none">
                        <Calendar className="h-4 w-4" /> Turnos
                    </TabsTrigger>
                    <TabsTrigger value="benefits" className="rounded-[1.6rem] h-full px-10 text-[10px] font-black uppercase tracking-[0.2em] gap-3 data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-500 shadow-none">
                        <Gift className="h-4 w-4" /> Beneficios
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="delivery" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SupplierSalesDashboard supplierId={user.uid} />
                </TabsContent>

                <TabsContent value="turns" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <CluberTurnsAnalytics supplierId={user.uid} />
                </TabsContent>

                <TabsContent value="benefits" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <SupplierAnalyticsDashboard supplierId={user.uid} />
                </TabsContent>
            </Tabs>
        </div>
    );
}



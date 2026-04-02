'use client';

export const dynamic = 'force-dynamic';

import { useUser } from '@/firebase';
import BackButton from '@/components/layout/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import SupplierAnalyticsDashboard from '@/components/analytics/SupplierAnalyticsDashboard';
import SupplierSalesDashboard from '@/components/analytics/SupplierSalesDashboard';
import GlobalAnalyticsDashboard from '@/components/analytics/GlobalAnalyticsDashboard';
import SplashScreen from '@/components/layout/splash-screen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Store, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SupplierAnalyticsPage() {
    const { user, isUserLoading, roles } = useUser();
    
    if (isUserLoading) {
        return <SplashScreen />;
    }

    const isSupplier = roles.includes('supplier');

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
                <AlertDescription>Debes ser un proveedor o administrador para ver estas analíticas.</AlertDescription>
            </Alert>
        </div>;
    }

    return (
        <div className="p-4 md:p-8 pt-12 md:pt-16 max-w-[1400px] mx-auto">
            <BackButton />
            
            <Tabs defaultValue="sales" className="mt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground">Mis Analíticas</h1>
                        <p className="text-sm font-bold text-muted-foreground mt-2 uppercase tracking-widest italic">
                            Reporte Financiero y Operativo
                        </p>
                    </div>

                    <TabsList className="bg-black/5 dark:bg-white/5 p-1 h-14 rounded-2xl glass glass-dark border border-black/10 dark:border-white/10">
                        <TabsTrigger value="sales" className="rounded-xl h-full px-8 text-xs font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all shadow-none">
                            <TrendingUp className="h-4 w-4" /> Pedidos & Ventas
                        </TabsTrigger>
                        <TabsTrigger value="redemptions" className="rounded-xl h-full px-8 text-xs font-black uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all shadow-none">
                            <Store className="h-4 w-4" /> Beneficios QR
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="sales" className="mt-0 outline-none">
                    <SupplierSalesDashboard supplierId={user.uid} />
                </TabsContent>

                <TabsContent value="redemptions" className="mt-0 outline-none">
                    <SupplierAnalyticsDashboard supplierId={user.uid} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

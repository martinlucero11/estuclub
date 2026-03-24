'use client';
import { useUser } from '@/firebase';
import BackButton from '@/components/layout/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import SupplierAnalyticsDashboard from '@/components/analytics/SupplierAnalyticsDashboard';
import SplashScreen from '@/components/layout/splash-screen';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ChartBar } from '@phosphor-icons/react';

export default function SupplierAnalyticsPage() {
    const { user, isUserLoading, roles } = useUser();
    
    if (isUserLoading) {
        return <SplashScreen />;
    }

    const isSupplier = roles.includes('supplier');

    if (!user || !isSupplier) {
        return <div className="p-8">
            <BackButton />
            <Alert variant="destructive">
                <ChartBar className="h-4 w-4" />
                <AlertTitle>Acceso Denegado</AlertTitle>
                <AlertDescription>Debes ser un proveedor para ver estas analíticas.</AlertDescription>
            </Alert>
        </div>;
    }

    return (
        <div className="space-y-4 p-4 md:p-8">
            <BackButton />
            <h1 className="text-3xl font-bold">Mis Analíticas</h1>
            <p className="text-muted-foreground">
                Un resumen de la performance y el alcance de tus beneficios.
            </p>
            <SupplierAnalyticsDashboard supplierId={user.uid} />
        </div>
    );
}

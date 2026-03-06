'use client';
import { useAdmin } from '@/firebase/auth/use-admin';
import AdminAccessDenied from '@/components/admin/admin-access-denied';
import BackButton from '@/components/layout/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import AdminAnalyticsDashboard from '@/components/analytics/AdminAnalyticsDashboard';

export default function AdminAnalyticsPage() {
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    if (isAdminLoading) {
        return <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>;
    }

    if (!isAdmin) {
        return <div className="p-8">
            <BackButton />
            <AdminAccessDenied title="Acceso a Analíticas Denegado" description="Solo los administradores pueden ver las analíticas globales." />
        </div>;
    }

    return (
        <div className="space-y-4 p-4 md:p-8">
            <BackButton />
            <h1 className="text-3xl font-bold">Analíticas Globales</h1>
            <p className="text-muted-foreground">
                Una vista general de la actividad y el crecimiento de la plataforma.
            </p>
            <AdminAnalyticsDashboard />
        </div>
    );
}

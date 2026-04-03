'use client';
export const dynamic = 'force-dynamic';

import { useAdmin } from '@/firebase/auth/use-admin';
import AdminAccessDenied from '@/components/admin/admin-access-denied';
import { ApplicationsTable } from '@/components/admin/cinco-dos/applications-table';
import { CincoDosLogo } from '@/components/cinco-dos/cinco-dos-logo';
import BackButton from '@/components/layout/back-button';
import { Skeleton } from '@/components/ui/skeleton';
import { CincoDosSettings } from '@/components/admin/cinco-dos/cinco-dos-settings';

export default function CincoDosAdminPage() {
    const { isAdmin, isLoading } = useAdmin();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    if (!isAdmin) {
        return <AdminAccessDenied title="Acceso Denegado" description="Esta sección está reservada para el personal de administración de Cinco.Dos" />;
    }

    return (
        <div className="space-y-6">
            <BackButton />
            <div className="flex items-center gap-4 border-b pb-4">
                <div className="p-3 bg-white hover:bg-white/90 transition-colors rounded-2xl flex items-center justify-center shadow-premium">
                    <CincoDosLogo className="w-10 h-10 text-black" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Solicitudes Cinco.Dos</h1>
                    <p className="text-foreground mt-1">
                        Gestiona, aprueba y rechaza las inscripciones al comedor universitario.
                    </p>
                </div>
            </div>

            <CincoDosSettings />

            <ApplicationsTable />
        </div>
    );
}



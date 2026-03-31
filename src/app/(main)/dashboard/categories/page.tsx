'use client';

import { useAdmin } from '@/firebase/auth/use-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryTable } from './components/category-table';
import BackButton from '@/components/layout/back-button';

function AdminAccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center pt-16">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                    <CardDescription>
                        Solo los administradores pueden gestionar las categorías.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}

export default function CategoriesPage() {
    const { isAdmin, isLoading } = useAdmin();

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!isAdmin) {
        return <AdminAccessDenied />;
    }

    return (
        <div className="space-y-4">
            <BackButton />
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Gestión de Categorías</h1>
            </div>
            <p className="text-muted-foreground">
                Crea, edita y elimina las categorías de beneficios que aparecen en la página de inicio.
            </p>
            <CategoryTable />
        </div>
    );
}


'use client';

import MainLayout from '@/components/layout/main-layout';
import QrScanner from '@/components/supplier/qr-scanner';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center pt-16">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                    <CardDescription>
                        Solo los proveedores pueden acceder a esta función.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

function LoadingSkeleton() {
     return (
        <div className="flex flex-col items-center">
            <header className="w-full max-w-lg space-y-2 mb-8 text-center">
                <Skeleton className="h-10 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-full mx-auto" />
            </header>
            <Skeleton className="h-96 w-full max-w-lg" />
        </div>
    )
}

export default function ScanPage() {
    const { isSupplier, isLoading } = useSupplier();

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8">
                   <LoadingSkeleton />
                </div>
            </MainLayout>
        );
    }
    
    if (!isSupplier) {
        return (
            <MainLayout>
                <AccessDenied />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
             <div className="flex-1 space-y-8 p-4 md:p-8 flex flex-col items-center">
                <header className="w-full max-w-lg space-y-2 mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        Escanear Código QR
                    </h1>
                    <p className="text-muted-foreground">
                        Apunta la cámara al código QR del estudiante para validar el canje del beneficio.
                    </p>
                </header>
                <div className="w-full max-w-lg">
                    <QrScanner />
                </div>
            </div>
        </MainLayout>
    )
}

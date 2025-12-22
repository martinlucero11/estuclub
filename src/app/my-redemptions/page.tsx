
'use client';

import MainLayout from '@/components/layout/main-layout';
import MyRedemptionsList from '@/components/my-redemptions/my-redemptions-list';
import { History, ShieldAlert } from 'lucide-react';
import { useUser } from '@/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function NotLoggedIn() {
     return (
        <div className="flex flex-col items-center justify-center pt-16">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="mt-4">Acceso Denegado</CardTitle>
                    <CardDescription>
                        Debes iniciar sesión para ver tus canjes.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

export default function MyRedemptionsPage() {
    const { user, isUserLoading } = useUser();
    
    if (isUserLoading) {
        return (
            <MainLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8">
                     <header className="space-y-2">
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </header>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Card key={i} className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                    <Skeleton className="h-10 w-24" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </MainLayout>
        )
    }

    if (!user) {
        return (
            <MainLayout>
                 <NotLoggedIn />
            </MainLayout>
        )
    }


    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                 <header className="space-y-2">
                    <div className="flex items-center gap-3">
                        <History className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Mis Canjes
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Aquí puedes ver el historial de todos los beneficios que has canjeado.
                    </p>
                </header>

                <MyRedemptionsList />
            </div>
        </MainLayout>
    );
}

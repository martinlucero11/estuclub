
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/firebase/auth/use-admin';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, History, User, Calendar, Tag, Fingerprint } from 'lucide-react';
import { makeBenefitRedemptionSerializable, type SerializableBenefitRedemption, type BenefitRedemption } from '@/lib/data';
import { useMemo } from 'react';

function RedemptionsListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

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
                        No tienes permisos para acceder a esta sección.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

function RedemptionsContent() {
    const { user } = useUser();
    const firestore = useFirestore();

    const redemptionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'redeemed_benefits'),
            where('ownerId', '==', user.uid),
            orderBy('redeemedAt', 'desc')
        );
    }, [user, firestore]);

    const { data: redemptions, isLoading } = useCollection<BenefitRedemption>(redemptionsQuery);
    
    const serializableRedemptions: SerializableBenefitRedemption[] = useMemo(() => {
        if (!redemptions) return [];
        return redemptions.map(makeBenefitRedemptionSerializable);
    }, [redemptions]);


    if (isLoading) {
        return <RedemptionsListSkeleton />;
    }

    if (!serializableRedemptions || serializableRedemptions.length === 0) {
        return (
            <Alert>
                <History className="h-4 w-4" />
                <AlertTitle>No hay canjes</AlertTitle>
                <AlertDescription>
                    No tienes canjes registrados a tu nombre.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="space-y-4">
            {serializableRedemptions.map(redemption => {
                 const userInitial = redemption.userName ? redemption.userName.charAt(0).toUpperCase() : 'U';
                 const redeemedDate = new Date(redemption.redeemedAt);

                return (
                <Card key={redemption.id} className="p-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <div className="md:col-span-1 flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback>{userInitial}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">{redemption.userName}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Fingerprint className="h-4 w-4" />
                                    <span>{redemption.userDni}</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                             <div className="flex items-center gap-2 text-sm font-medium">
                                <Tag className="h-4 w-4 text-primary" />
                                <p className="text-foreground">{redemption.benefitTitle}</p>
                            </div>
                        </div>
                        <div className="md:col-span-1 md:text-right">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground md:justify-end">
                                <Calendar className="h-4 w-4" />
                                <span>{redeemedDate.toLocaleDateString('es-ES')} - {redeemedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                     </div>
                </Card>
            )})}
        </div>
    )
}


export default function RedemptionsPage() {
    const { user, isUserLoading } = useUser();
    const { isSupplier, isLoading: isSupplierLoading } = useSupplier();
    const { isAdmin, isLoading: isAdminLoading } = useAdmin();

    const isLoading = isUserLoading || isSupplierLoading || isAdminLoading;
    
    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8">
                    <RedemptionsListSkeleton />
                </div>
            </MainLayout>
        )
    }

    if (!user || (!isSupplier && !isAdmin)) {
        return (
            <MainLayout>
                <AccessDenied />
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
                            Historial de Canjes
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Revisa todos los beneficios que han sido canjeados por los estudiantes.
                    </p>
                </header>

                <RedemptionsContent />
            </div>
        </MainLayout>
    );
}


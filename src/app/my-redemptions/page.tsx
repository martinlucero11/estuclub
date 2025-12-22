
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { History, ShieldAlert } from 'lucide-react';
import MyRedemptionsList from '@/components/profile/my-redemptions-list';
import { BenefitRedemption, makeBenefitRedemptionSerializable, SerializableBenefitRedemption } from '@/lib/data';
import { useMemo } from 'react';

function RedemptionsPageSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                         <Skeleton className="h-10 w-24" />
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
                        Debes iniciar sesión para ver tus canjes.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}


function MyRedemptionsContent() {
    const { user } = useUser();
    const firestore = useFirestore();

    const redemptionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'redeemed_benefits'),
            where('userId', '==', user.uid),
            orderBy('redeemedAt', 'desc')
        );
    }, [user, firestore]);

    const { data: redemptions, isLoading } = useCollection<BenefitRedemption>(redemptionsQuery);
    
    const serializableRedemptions: SerializableBenefitRedemption[] = useMemo(() => {
        if (!redemptions) return [];
        return redemptions.map(makeBenefitRedemptionSerializable);
    }, [redemptions]);


    if (isLoading) {
        return <RedemptionsPageSkeleton />;
    }

    return <MyRedemptionsList redemptions={serializableRedemptions} />
}


export default function MyRedemptionsPage() {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <MainLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8">
                     <RedemptionsPageSkeleton />
                </div>
            </MainLayout>
        )
    }
    
    if (!user) {
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
                            Mis Canjes
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Aquí puedes ver todos los beneficios que has canjeado.
                    </p>
                </header>

                <MyRedemptionsContent />
            </div>
        </MainLayout>
    );
}

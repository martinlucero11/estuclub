
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Award, Calendar, Archive, Eye } from 'lucide-react';
import { Suspense, useState } from 'react';
import RedeemedBenefitDialog from '@/components/redeemed/redeemed-benefit-dialog';
import { Button } from '@/components/ui/button';

interface RedeemedBenefit {
    id: string;
    benefitTitle: string;
    redeemedAt: Timestamp;
    points: number;
    status: 'valid' | 'used';
    userId: string;
    ownerId?: string; // Add ownerId
}

function RedeemedListSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                 <div key={i} className="flex items-center space-x-4 rounded-md border p-3">
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/5" />
                        <Skeleton className="h-4 w-2/5" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-20 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function RedeemedList() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [selectedBenefit, setSelectedBenefit] = useState<RedeemedBenefit | null>(null);

    const redeemedQuery = useMemoFirebase(
        () => user ? query(
            collection(firestore, 'redeemed_benefits'), // Query the root collection
            where('userId', '==', user.uid), // Filter by the current user's ID
            orderBy('redeemedAt', 'desc')
        ) : null,
        [user, firestore]
    );

    const { data: redeemedBenefits, isLoading: isCollectionLoading } = useCollection<RedeemedBenefit>(redeemedQuery);
    
    const isLoading = isUserLoading || isCollectionLoading;

    if (isLoading) {
        return <RedeemedListSkeleton />;
    }

    if (!redeemedBenefits || redeemedBenefits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No has canjeado beneficios</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    ¡Explora la sección de beneficios y empieza a sumar puntos!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {redeemedBenefits.map((benefit) => (
                <div key={benefit.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{benefit.benefitTitle}</p>
                         <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                            <Calendar className="h-3 w-3" />
                            {benefit.redeemedAt ? new Date(benefit.redeemedAt.seconds * 1000).toLocaleDateString('es-ES') : 'Fecha desconocida'}
                        </p>
                    </div>
                     <div className="flex shrink-0 items-center gap-2">
                        <div className="flex items-center justify-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-sm font-semibold text-secondary-foreground">
                            <Award className="h-4 w-4 text-primary" />
                            <span>+{benefit.points || 0}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedBenefit(benefit)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver Detalle</span>
                        </Button>
                    </div>
                </div>
            ))}
            {selectedBenefit && (
                <RedeemedBenefitDialog
                    benefit={selectedBenefit}
                    isOpen={!!selectedBenefit}
                    onOpenChange={(isOpen) => !isOpen && setSelectedBenefit(null)}
                />
            )}
        </div>
    );
}


export default function RedeemedBenefitsPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <header className="space-y-2">
                    <div className="flex items-center gap-3">
                        <History className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Tus Canjes
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Aquí puedes ver el historial de todos los beneficios que has canjeado.
                    </p>
                </header>
                
                <Suspense fallback={<RedeemedListSkeleton />}>
                    <RedeemedList />
                </Suspense>
            </div>
        </MainLayout>
    );
}

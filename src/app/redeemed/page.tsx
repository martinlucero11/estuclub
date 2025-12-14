
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
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
}

function RedeemedListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                         <div className="flex items-center justify-between pt-4 md:pt-0 md:justify-end md:gap-4">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}

function RedeemedList() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [selectedBenefit, setSelectedBenefit] = useState<RedeemedBenefit | null>(null);

    const redeemedQuery = useMemoFirebase(
        () => user ? query(
            collection(firestore, 'users', user.uid, 'redeemed_benefits'),
            orderBy('redeemedAt', 'desc')
        ) : null,
        [user, firestore]
    );

    const { data: redeemedBenefits, isLoading } = useCollection<RedeemedBenefit>(redeemedQuery);

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
        <div className="space-y-4">
            {redeemedBenefits.map((benefit) => (
                <Card key={benefit.id}>
                    <CardHeader className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div className="flex-1">
                            <CardTitle className="text-lg">{benefit.benefitTitle}</CardTitle>
                             <CardDescription className="flex items-center gap-2 pt-2">
                                <Calendar className="h-4 w-4" />
                                {benefit.redeemedAt ? new Date(benefit.redeemedAt.seconds * 1000).toLocaleDateString('es-ES') : 'Fecha desconocida'}
                            </CardDescription>
                        </div>
                         <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <div className="flex items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 font-semibold text-primary">
                                <Award className="h-5 w-5" />
                                <span>+{benefit.points || 0} Puntos</span>
                            </div>
                            <Button variant="outline" onClick={() => setSelectedBenefit(benefit)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalle
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
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

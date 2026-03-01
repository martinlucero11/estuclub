'use client';

import { useDocOnce, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { notFound } from 'next/navigation';
import type { SerializableBenefit } from '@/types/data';
import PerkDetailSkeleton from '@/components/perks/perk-detail-skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Award, Flame } from 'lucide-react';
import dynamic from 'next/dynamic';
import { makeBenefitSerializable } from '@/lib/data';
import { createConverter } from '@/lib/firestore-converter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const RedeemBenefitDialog = dynamic(() => import('@/components/perks/redeem-perk-dialog'), {
  ssr: false,
  loading: () => <Button className="w-full" disabled>Cargando...</Button>
});

export default function BenefitDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const benefitRef = useMemo(() => {
        if (!id) return null;
        return doc(firestore, 'benefits', id).withConverter(createConverter<SerializableBenefit>());
    }, [id, firestore]);
    
    const { data: benefit, isLoading, error } = useDocOnce(benefitRef);

    if (isLoading || isUserLoading) {
        return <PerkDetailSkeleton />;
    }

    if (error) {
        return (
            <MainLayout>
                <div className="p-8">
                     <Alert variant="destructive">
                        <AlertTitle>Error al cargar el beneficio</AlertTitle>
                        <AlertDescription>{error.message}</AlertDescription>
                    </Alert>
                </div>
            </MainLayout>
        );
    }
    
    if (!benefit) {
        notFound();
    }

    const serializableBenefit = makeBenefitSerializable(benefit as any);

    return (
        <MainLayout>
            <div className="p-4 md:p-8">
                <Card className="overflow-hidden">
                     <div className="relative w-full h-64 md:h-80">
                        <Image
                            src={serializableBenefit.imageUrl}
                            alt={serializableBenefit.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {serializableBenefit.isFeatured && (
                             <div className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                                <Flame className="h-4 w-4" />
                                <span>Destacado</span>
                            </div>
                        )}

                        <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-primary/80 px-3 py-1.5 text-sm font-bold text-primary-foreground backdrop-blur-sm">
                            <Award className="h-4 w-4" />
                            <span>{serializableBenefit.points} PTS</span>
                        </div>
                    </div>
                    <div className='flex flex-1 flex-col'>
                        <CardHeader>
                            <CardTitle className="text-3xl lg:text-4xl">{serializableBenefit.title}</CardTitle>
                            <CardDescription className="text-base">{serializableBenefit.category}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <p className="text-muted-foreground">{serializableBenefit.description}</p>
                            {serializableBenefit.location && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-5 w-5 flex-shrink-0 text-primary" />
                                    <span>{serializableBenefit.location}</span>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                             <RedeemBenefitDialog benefit={serializableBenefit}>
                                <Button className="w-full sm:w-auto" size="lg" disabled={isUserLoading || !user}>
                                    {isUserLoading ? 'Cargando...' : 'Canjear Beneficio'}
                                    {!isUserLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </RedeemBenefitDialog>
                        </CardFooter>
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
}
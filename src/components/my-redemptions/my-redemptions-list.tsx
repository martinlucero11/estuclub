'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase, useDocOnce } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { History, Tag, Calendar, CheckCircle, MapPin } from 'lucide-react';
import type { BenefitRedemption, SerializableBenefitRedemption, Perk } from '@/lib/data';
import { makeBenefitRedemptionSerializable } from '@/lib/data';
import { useMemo } from 'react';
import { Badge } from '../ui/badge';
import RedemptionQRCodeDialog from './redemption-qr-code-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from 'next/image';

function RedemptionsListSkeleton() {
    return (
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
    );
}

// New component to fetch and display benefit details
function RedeemedBenefitDetails({ benefitId }: { benefitId: string }) {
    const firestore = useFirestore();
    const benefitRef = useMemoFirebase(() => doc(firestore, 'benefits', benefitId), [firestore, benefitId]);
    const { data: benefit, isLoading } = useDocOnce<Perk>(benefitRef);

    if (isLoading) {
        return (
            <div className="flex gap-4 p-4">
                <Skeleton className="h-24 w-24 rounded-md" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        );
    }

    if (!benefit) {
        return <div className="p-4 text-sm text-muted-foreground">Detalles del beneficio no disponibles.</div>;
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 px-4 pb-4">
            <div className="relative h-32 w-full sm:w-32 flex-shrink-0">
                 <Image src={benefit.imageUrl} alt={benefit.title} fill className="rounded-md object-cover" />
            </div>
            <div className="space-y-2">
                 <p className="text-sm text-muted-foreground">{benefit.description}</p>
                 {benefit.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{benefit.location}</span>
                    </div>
                 )}
            </div>
        </div>
    )
}


export default function MyRedemptionsList() {
    const { user } = useUser();
    const firestore = useFirestore();

    const redemptionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        // CORRECTED QUERY: Point to the user's subcollection
        return query(
            collection(firestore, 'users', user.uid, 'redeemed_benefits'),
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
                <AlertTitle>No tienes canjes</AlertTitle>
                <AlertDescription>
                   Aún no has canjeado ningún beneficio. ¡Explora y empieza a disfrutar!
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <Accordion type="single" collapsible className="w-full space-y-4">
            {serializableRedemptions.map(redemption => {
                const redeemedDate = new Date(redemption.redeemedAt);

                return (
                    <AccordionItem value={redemption.id} key={redemption.id} className="border-none">
                        <Card>
                             <AccordionTrigger className="p-4 hover:no-underline w-full">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center w-full">
                                    <div className="md:col-span-1">
                                        <div className="flex items-center gap-2 text-sm font-medium text-left">
                                            <Tag className="h-4 w-4 text-primary" />
                                            <p className="text-foreground truncate">{redemption.benefitTitle}</p>
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 flex flex-col items-start md:items-center">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>{redeemedDate.toLocaleDateString('es-ES')} - {redeemedDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 flex items-center justify-start md:justify-end gap-4">
                                        <Badge variant={redemption.status === 'used' ? 'secondary' : 'default'}>
                                            {redemption.status === 'pending' ? 'Pendiente' : 'Usado'}
                                        </Badge>
                                        {redemption.status === 'pending' ? (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <RedemptionQRCodeDialog
                                                    redemptionId={redemption.id}
                                                    qrCodeValue={redemption.qrCodeValue}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-green-600">
                                                <CheckCircle className="h-5 w-5" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <RedeemedBenefitDetails benefitId={redemption.benefitId} />
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}


'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { History, Calendar, Fingerprint, Tag, User as UserIcon } from 'lucide-react';
import type { BenefitRedemption } from '@/lib/data';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

function RedemptionListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}


export default function RedemptionList() {
    const { user } = useUser();
    const firestore = useFirestore();

    const redemptionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'benefitRedemptions'),
            where('supplierId', '==', user.uid),
            orderBy('usedAt', 'desc')
        );
    }, [user, firestore]);

    const { data: redemptions, isLoading } = useCollection<BenefitRedemption>(redemptionsQuery);
    
    if (isLoading) {
        return <RedemptionListSkeleton />;
    }

    if (!redemptions || redemptions.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">Sin canjes todavía</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Aún no se ha canjeado ninguno de tus beneficios.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {redemptions.map(redemption => {
                const usedAt = (redemption.usedAt as Timestamp)?.toDate();
                const userInitial = redemption.userName.charAt(0).toUpperCase();

                return (
                    <Card key={redemption.id} className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                             <div className="col-span-1 flex items-center gap-3">
                                 <Avatar className='h-12 w-12'>
                                    <AvatarFallback>{userInitial}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{redemption.userName}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Fingerprint className="h-4 w-4" />
                                        <span>{redemption.userDni}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 space-y-2 text-sm">
                                <div className='flex items-center gap-2 text-muted-foreground'>
                                    <Tag className='h-4 w-4'/>
                                    <span className="font-medium text-foreground">{redemption.benefitTitle}</span>
                                </div>
                                <div className='flex items-center gap-2 text-muted-foreground'>
                                    <Calendar className='h-4 w-4'/>
                                    {usedAt ? usedAt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Fecha pendiente'}
                                </div>
                            </div>
                             <div className="col-span-1 flex items-center justify-start sm:justify-end">
                                <p className="text-sm font-bold text-primary">
                                    + {redemption.pointsGranted} PTS
                                </p>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

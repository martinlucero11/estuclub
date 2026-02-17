
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { History, Calendar, Fingerprint, Tag, Building } from 'lucide-react';
import type { BenefitRedemption } from '@/lib/data';

function AllRedemptionsListSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div className="flex-1 space-y-2">
                             <Skeleton className="h-5 w-3/4" />
                        </div>
                         <div className="flex-1 space-y-2">
                             <Skeleton className="h-5 w-2/4" />
                        </div>
                         <div className="flex-1 space-y-2">
                             <Skeleton className="h-5 w-3/4" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}


export default function AllRedemptionsList() {
    const firestore = useFirestore();
    const { user } = useUser();

    const redemptionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'benefitRedemptions'),
            where('supplierId', '==', user.uid),
            orderBy('redeemedAt', 'desc')
        );
    }, [firestore, user]);

    const { data: redemptions, isLoading } = useCollection<BenefitRedemption>(redemptionsQuery);
    
    if (isLoading) {
        return <AllRedemptionsListSkeleton />;
    }
    
    if (!user) {
        return (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">Inicia sesión</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Debes iniciar sesión para ver los canjes.
                </p>
            </div>
        )
    }

    if (!redemptions || redemptions.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No hay canjes para mostrar</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    No se encontraron canjes asociados a tu cuenta de proveedor.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {redemptions.map(redemption => {
                const redeemedAt = (redemption.redeemedAt as Timestamp)?.toDate();
                const userInitial = redemption.userName.charAt(0).toUpperCase();

                return (
                    <Card key={redemption.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                             <div className="md:col-span-1 flex items-center gap-3">
                                 <Avatar>
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
                            <div className="md:col-span-1 space-y-2 text-sm">
                                <div className='flex items-center gap-2'>
                                    <Tag className='h-4 w-4 text-primary'/>
                                    <span className="font-medium text-foreground">{redemption.benefitTitle}</span>
                                </div>
                            </div>
                            <div className="md:col-span-1 space-y-2 text-sm">
                               <div className='flex items-center gap-2 text-muted-foreground'>
                                    <Building className='h-4 w-4'/>
                                    <span>{redemption.supplierName}</span>
                               </div>
                            </div>
                             <div className="md:col-span-1 flex items-center justify-start md:justify-end">
                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                    <Calendar className='h-4 w-4'/>
                                    {redeemedAt ? redeemedAt.toLocaleString('es-ES') : 'Fecha pendiente'}
                                </div>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

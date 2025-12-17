
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Users, Calendar, Fingerprint, Ticket } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface RedeemedBenefit {
    id: string;
    benefitTitle: string;
    redeemedAt: Timestamp;
    status: 'valid' | 'used';
    userId: string;
    userName: string;
    userDni: string;
}

function RedeemedListSkeleton() {
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

export default function RedeemedByUsersList() {
    const { user } = useUser();
    const firestore = useFirestore();

    const redeemedQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'redeemed_benefits'),
            where('supplierId', '==', user.uid),
            orderBy('redeemedAt', 'desc')
        );
    }, [user, firestore]);

    const { data: redeemedBenefits, isLoading } = useCollection<RedeemedBenefit>(redeemedQuery);
    
    if (isLoading) {
        return <RedeemedListSkeleton />;
    }

    if (!redeemedBenefits || redeemedBenefits.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">Sin canjes por ahora</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Cuando los estudiantes canjeen tus beneficios, aparecerán aquí.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {redeemedBenefits.map(redemption => {
                const redemptionDate = (redemption.redeemedAt as Timestamp)?.toDate();
                const userInitial = redemption.userName ? redemption.userName.charAt(0).toUpperCase() : '?';

                return (
                    <Card key={redemption.id} className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
                             <div className="flex items-center gap-3">
                                 <Avatar className='h-10 w-10'>
                                    <AvatarFallback>{userInitial}</AvatarFallback>
                                 </Avatar>
                                <div>
                                    <p className="font-semibold">{redemption.userName}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Fingerprint className="h-3 w-3" /> {redemption.userDni}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className='flex items-center gap-2 font-medium'>
                                    <Ticket className='h-4 w-4 text-primary'/>
                                    {redemption.benefitTitle}
                                </div>
                                <div className='flex items-center gap-2 text-muted-foreground'>
                                    <Calendar className='h-4 w-4'/>
                                    {redemptionDate ? redemptionDate.toLocaleString('es-ES') : 'Fecha inválida'}
                                </div>
                            </div>
                             <div className="flex justify-start sm:justify-end">
                                <Badge variant={redemption.status === 'valid' ? 'default' : 'secondary'} className={cn(redemption.status === 'valid' && 'bg-green-600')}>
                                    {redemption.status === 'valid' ? 'Válido' : 'Ya utilizado'}
                                </Badge>
                             </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

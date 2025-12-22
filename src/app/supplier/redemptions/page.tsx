
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, History, Calendar, Tag, Fingerprint, CheckCircle, Hourglass } from 'lucide-react';
import { makeBenefitRedemptionSerializable, type SerializableBenefitRedemption, type BenefitRedemption } from '@/lib/data';
import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User as FirebaseUser } from 'firebase/auth';

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
                        No tienes permisos de proveedor para acceder a esta sección.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}

function RedemptionList({ redemptions }: { redemptions: SerializableBenefitRedemption[] }) {
     if (!redemptions || redemptions.length === 0) {
        return (
            <Alert>
                <History className="h-4 w-4" />
                <AlertTitle>No hay canjes</AlertTitle>
                <AlertDescription>
                    No se encontraron canjes en esta categoría.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
        <div className="space-y-4">
            {redemptions.map(redemption => {
                 const userInitial = redemption.userName ? redemption.userName.charAt(0).toUpperCase() : 'U';
                 const redeemedDate = new Date(redemption.redeemedAt);
                 const usedDate = redemption.usedAt ? new Date(redemption.usedAt) : null;

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
                        <div className="md:col-span-1 space-y-1">
                             <div className="flex items-center gap-2 text-sm font-medium text-primary">
                                <Tag className="h-4 w-4" />
                                <p className="text-foreground">{redemption.benefitTitle}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Canjeado: {redeemedDate.toLocaleString('es-ES')}</span>
                            </div>
                            {usedDate && (
                                 <div className="flex items-center gap-2 text-xs text-green-600">
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Usado: {usedDate.toLocaleString('es-ES')}</span>
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-1 flex items-center justify-start md:justify-end gap-4">
                            <Badge variant={redemption.status === 'used' ? 'secondary' : 'default'}>
                                {redemption.status === 'pending' ? 'Pendiente' : 'Usado'}
                           </Badge>
                        </div>
                     </div>
                </Card>
            )})}
        </div>
    )
}

function RedemptionsContent({ user }: { user: FirebaseUser }) {
    const firestore = useFirestore();

    const redemptionsQuery = useMemoFirebase(() => {
        return query(
            collection(firestore, 'benefitRedemptions'), 
            where('supplierId', '==', user.uid), 
            orderBy('redeemedAt', 'desc')
        );
    }, [firestore, user.uid]);

    const { data: redemptions, isLoading } = useCollection<BenefitRedemption>(redemptionsQuery);
    
    const { pendingRedemptions, usedRedemptions } = useMemo(() => {
        if (!redemptions) return { pendingRedemptions: [], usedRedemptions: [] };
        
        const serializable = redemptions.map(makeBenefitRedemptionSerializable);
        return {
            pendingRedemptions: serializable.filter(r => r.status === 'pending'),
            usedRedemptions: serializable.filter(r => r.status === 'used'),
        }
    }, [redemptions]);


    if (isLoading) {
        return <RedemptionsListSkeleton />;
    }

    if (!redemptions && !isLoading) {
        return (
            <Alert>
                <History className="h-4 w-4" />
                <AlertTitle>No hay canjes</AlertTitle>
                <AlertDescription>
                    Aún no se han registrado canjes en tu comercio.
                </AlertDescription>
            </Alert>
        );
    }
    
    return (
       <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">
                    <Hourglass className="mr-2 h-4 w-4" />
                    Pendientes ({pendingRedemptions.length})
                </TabsTrigger>
                <TabsTrigger value="used">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Usados ({usedRedemptions.length})
                </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
                <RedemptionList redemptions={pendingRedemptions} />
            </TabsContent>
            <TabsContent value="used" className="mt-4">
                 <RedemptionList redemptions={usedRedemptions} />
            </TabsContent>
       </Tabs>
    )
}


export default function RedemptionsPage() {
    const { user, isUserLoading } = useUser();
    const { isSupplier, isLoading: isSupplierLoading } = useSupplier();

    const isLoading = isUserLoading || isSupplierLoading;
    
    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex-1 space-y-8 p-4 md:p-8">
                    <RedemptionsListSkeleton />
                </div>
            </MainLayout>
        )
    }

    if (!user || !isSupplier) {
        return (
            <MainLayout>
                 <div className="flex-1 space-y-8 p-4 md:p-8">
                    <AccessDenied />
                 </div>
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
                        Revisa todos los beneficios que han sido canjeados por los estudiantes en tu comercio.
                    </p>
                </header>
                <RedemptionsContent user={user} />
            </div>
        </MainLayout>
    );
}

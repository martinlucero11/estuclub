
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { History, User, Tag, Calendar, Archive } from 'lucide-react';
import { Suspense } from 'react';

interface BenefitRedemption {
  id: string;
  benefitTitle: string;
  userName: string;
  redeemedAt: Timestamp;
}

function RedemptionListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RedemptionList() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const redemptionsQuery = useMemoFirebase(
    () => user ? query(
      collection(firestore, 'benefitRedemptions'),
      where('supplierId', '==', user.uid),
      orderBy('redeemedAt', 'desc')
    ) : null,
    [user, firestore]
  );

  const { data: redemptions, isLoading: isCollectionLoading } = useCollection<BenefitRedemption>(redemptionsQuery);
  const isLoading = isUserLoading || isCollectionLoading;

  if (isLoading) {
    return <RedemptionListSkeleton />;
  }

  if (!redemptions || redemptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
        <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">Sin canjes por ahora</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Cuando un usuario canjee uno de tus beneficios, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {redemptions.map((redemption) => (
        <Card key={redemption.id}>
          <CardContent className="flex items-start gap-4 p-4">
            <div className="flex-shrink-0 pt-1">
                <History className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-foreground">{redemption.benefitTitle}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>{redemption.userName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(redemption.redeemedAt.seconds * 1000).toLocaleString('es-ES')}</span>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function SupplierRedemptionsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl space-y-8 p-4 md:p-8">
        <header className="space-y-2">
            <div className="flex items-center gap-3">
                <History className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    Historial de Canjes
                </h1>
            </div>
            <p className="text-muted-foreground">
                Aquí puedes ver todos los beneficios que los usuarios han canjeado en tu comercio.
            </p>
        </header>

        <Suspense fallback={<RedemptionListSkeleton />}>
            <RedemptionList />
        </Suspense>
      </div>
    </MainLayout>
  );
}

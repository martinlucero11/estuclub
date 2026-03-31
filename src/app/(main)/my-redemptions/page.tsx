
'use client';

import MainLayout from '@/components/layout/main-layout';
import MyRedemptionsList from '@/components/my-redemptions/my-redemptions-list';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';


function RedemptionsSkeleton() {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
}


export default function MyRedemptionsPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Mi Historial de Canjes" />
                <p className="text-muted-foreground -mt-8 mb-8">
                    Aquí puedes ver todos los beneficios que has canjeado.
                </p>

                <Suspense fallback={<RedemptionsSkeleton />}>
                    <MyRedemptionsList />
                </Suspense>
            </div>
        </MainLayout>
    );
}

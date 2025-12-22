
'use client';

import MainLayout from '@/components/layout/main-layout';
import MyRedemptionsList from '@/components/my-redemptions/my-redemptions-list';
import { History } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


function RedemptionsSkeleton() {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
}


export default function MyRedemptionsPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <header className="space-y-2">
                     <div className="flex items-center gap-3">
                        <History className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Mi Historial de Canjes
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Aquí puedes ver todos los beneficios que has canjeado.
                    </p>
                </header>

                <Suspense fallback={<RedemptionsSkeleton />}>
                    <MyRedemptionsList />
                </Suspense>
            </div>
        </MainLayout>
    );
}

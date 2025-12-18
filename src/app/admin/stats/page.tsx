
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp, getCountFromServer, getDocs } from 'firebase/firestore';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart2, TrendingUp, Calendar, Tag, Building, Package } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';

interface BenefitRedemption {
    id?: string;
    benefitId: string;
    benefitTitle: string;
    supplierId: string;
    redeemedAt: Timestamp;
}

interface AggregatedData {
    totalRedemptions: number;
    redemptionsByMonth: { [key: string]: number };
    redemptionsByBenefit: { [key: string]: { name: string, count: number } };
    redemptionsBySupplier: { [key: string]: number };
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-10 w-1/2" /></CardContent></Card>
      <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
      <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
    </div>
  );
}

async function aggregateRedemptionData(firestore: any): Promise<AggregatedData> {
    const redemptionsRef = collection(firestore, 'benefitRedemptions');
    const q = query(redemptionsRef);

    const [totalSnapshot, allDocsSnapshot] = await Promise.all([
        getCountFromServer(q),
        getDocs(q)
    ]);

    const redemptions = allDocsSnapshot.docs.map(doc => doc.data() as BenefitRedemption);

    const redemptionsByMonth = redemptions.reduce((acc, curr) => {
        const month = new Date(curr.redeemedAt.seconds * 1000).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const redemptionsByBenefit = redemptions.reduce((acc, curr) => {
        if (!acc[curr.benefitId]) {
            acc[curr.benefitId] = { name: curr.benefitTitle, count: 0 };
        }
        acc[curr.benefitId].count++;
        return acc;
    }, {} as { [key: string]: { name: string, count: number } });
    
    const redemptionsBySupplier = redemptions.reduce((acc, curr) => {
        acc[curr.supplierId] = (acc[curr.supplierId] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    return {
        totalRedemptions: totalSnapshot.data().count,
        redemptionsByMonth,
        redemptionsByBenefit,
        redemptionsBySupplier
    };
}

export default function AdminStatsPage() {
    const firestore = useFirestore();
    const [data, setData] = useState<AggregatedData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (firestore) {
            aggregateRedemptionData(firestore)
                .then(setData)
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [firestore]);

    if (isLoading) {
        return (
            <MainLayout>
                 <div className="container mx-auto max-w-6xl space-y-8 p-4 md:p-8">
                    <header className="space-y-2">
                        <div className="flex items-center gap-3">
                            <BarChart2 className="h-8 w-8 text-primary" />
                            <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Canjes</h1>
                        </div>
                        <p className="text-muted-foreground">Métricas y análisis sobre los beneficios canjeados.</p>
                    </header>
                    <StatsSkeleton />
                 </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="container mx-auto max-w-6xl space-y-8 p-4 md:p-8">
                <header className="space-y-2">
                    <div className="flex items-center gap-3">
                        <BarChart2 className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight">Estadísticas de Canjes</h1>
                    </div>
                    <p className="text-muted-foreground">Métricas y análisis sobre los beneficios canjeados.</p>
                </header>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Canjes</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data?.totalRedemptions}</div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-5 w-5" /> Canjes por Mes</CardTitle></CardHeader>
                        <CardContent className="pl-2">
                             <div className="space-y-2">
                                {data && Object.entries(data.redemptionsByMonth).map(([month, count]) => (
                                    <div key={month} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                        <span className="text-sm capitalize">{month}</span>
                                        <span className="font-semibold">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Package className="h-5 w-5"/> Canjes por Beneficio</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            {data && Object.entries(data.redemptionsByBenefit)
                                .sort(([,a],[,b]) => b.count - a.count)
                                .map(([id, { name, count }]) => (
                                <div key={id} className="flex items-center justify-between text-sm">
                                    <span className="truncate pr-2">{name}</span>
                                    <span className="font-mono font-semibold rounded bg-secondary px-2 py-0.5 text-secondary-foreground">{count}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building className="h-5 w-5"/> Canjes por Comercio</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                           {data && Object.entries(data.redemptionsBySupplier)
                                .sort(([,a],[,b]) => b - a)
                                .map(([id, count]) => (
                                <div key={id} className="flex items-center justify-between text-sm">
                                    <span className="truncate pr-2 font-mono text-xs">{id}</span>
                                    <span className="font-mono font-semibold rounded bg-secondary px-2 py-0.5 text-secondary-foreground">{count}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}

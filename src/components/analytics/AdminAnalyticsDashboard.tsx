'use client';

import { useCollectionOnce, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { useMemo } from 'react';
import { BarChart, Users, Building, Gift, Ticket } from 'lucide-react';
import { StatCard } from './StatCard';
import { CategoryPieChart } from './CategoryPieChart';
import { TimeSeriesChart } from './TimeSeriesChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, SupplierProfile, Benefit, BenefitRedemption } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="lg:col-span-4 h-80" />
                <Skeleton className="lg:col-span-3 h-80" />
            </div>
        </div>
    );
}

export default function AdminAnalyticsDashboard() {
    const firestore = useFirestore();

    const usersQuery = useMemo(() => 
        query(collection(firestore, 'users').withConverter(createConverter<UserProfile>())),
        [firestore]
    );
    const { data: users, isLoading: usersLoading } = useCollectionOnce<UserProfile>(usersQuery);

    const suppliersQuery = useMemo(() =>
        query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())),
        [firestore]
    );
    const { data: suppliers, isLoading: suppliersLoading } = useCollectionOnce<SupplierProfile>(suppliersQuery);

    const benefitsQuery = useMemo(() =>
        query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>())),
        [firestore]
    );
    const { data: benefits, isLoading: benefitsLoading } = useCollectionOnce<Benefit>(benefitsQuery);
    
    const redemptionsQuery = useMemo(() =>
        query(collection(firestore, 'benefitRedemptions').withConverter(createConverter<BenefitRedemption>())),
        [firestore]
    );
    const { data: redemptions, isLoading: redemptionsLoading } = useCollectionOnce<BenefitRedemption>(redemptionsQuery);

    const isLoading = usersLoading || suppliersLoading || benefitsLoading || redemptionsLoading;

    const stats = useMemo(() => {
        if (!users || !suppliers || !benefits || !redemptions) return null;
        
        const redemptionsByCategory = redemptions.reduce((acc, r) => {
            const benefit = benefits.find(b => b.id === r.benefitId);
            if (benefit) {
                acc[benefit.category] = (acc[benefit.category] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const pieChartData = Object.entries(redemptionsByCategory).map(([name, value]) => ({ name, value }));

        return {
            totalUsers: users.length,
            totalSuppliers: suppliers.length,
            totalBenefits: benefits.length,
            totalRedemptions: redemptions.length,
            pieChartData
        };
    }, [users, suppliers, benefits, redemptions]);

    if (isLoading) {
        return <LoadingSkeleton />;
    }
    
    if (!stats) {
        return <p>No se pudieron cargar las analíticas.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Usuarios Totales" value={stats.totalUsers} icon={Users} />
                <StatCard title="Proveedores Totales" value={stats.totalSuppliers} icon={Building} href="/panel-cluber/supplier-management" />
                <StatCard title="Beneficios Totales" value={stats.totalBenefits} icon={Gift} href="/panel-cluber/benefits" />
                <StatCard title="Canjes Globales" value={stats.totalRedemptions} icon={Ticket} href="/panel-cluber/redemptions" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Canjes por Día</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <TimeSeriesChart data={redemptions || []} dataKey="redeemedAt" />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Canjes por Categoría de Beneficio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CategoryPieChart data={stats.pieChartData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

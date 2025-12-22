
'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useSupplier } from '@/firebase/auth/use-supplier';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { Ticket, Users, TrendingUp } from 'lucide-react';
import type { BenefitRedemption } from '@/lib/data';

function StatsCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

export default function RedemptionStats() {
    const { user, isUserLoading: isUserLoadingAuth } = useUser();
    const { isSupplier, isLoading: isSupplierLoading } = useSupplier();
    const firestore = useFirestore();

    const redemptionsQuery = useMemoFirebase(() => {
        // Double guard: only build the query if the user is authenticated AND is a supplier.
        if (!user?.uid || !isSupplier) {
            return null;
        }
        return query(
            collection(firestore, 'benefitRedemptions'),
            where('supplierId', '==', user.uid)
        );
    }, [user?.uid, isSupplier, firestore]);

    const { data: redemptions, isLoading: isLoadingData } = useCollection<BenefitRedemption>(redemptionsQuery);
    
    // Combined loading state
    const isLoading = isUserLoadingAuth || isSupplierLoading || (!!redemptionsQuery && isLoadingData);

    // If we're not a supplier, and not loading, render nothing. This component shouldn't show.
    if (!isSupplier && !isLoading) {
        return null; 
    }

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
        );
    }

    const totalRedemptions = redemptions?.length || 0;
    const pendingRedemptions = redemptions?.filter(r => r.status === 'pending').length || 0;
    const uniqueUsers = redemptions ? new Set(redemptions.map(r => r.userId)).size : 0;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <StatsCard title="Canjes Totales" value={totalRedemptions} icon={TrendingUp} />
            <StatsCard title="Canjes Pendientes" value={pendingRedemptions} icon={Ticket} />
            <StatsCard title="Clientes Únicos" value={uniqueUsers} icon={Users} />
        </div>
    );
}

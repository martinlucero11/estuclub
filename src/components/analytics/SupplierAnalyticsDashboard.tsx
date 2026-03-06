'use client';

import { useCollectionOnce, useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useMemo } from 'react';
import { Gift, Ticket, Users, Calendar, BarChart } from 'lucide-react';
import { StatCard } from './StatCard';
import { TimeSeriesChart } from './TimeSeriesChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Benefit, BenefitRedemption, Appointment } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';

interface SupplierAnalyticsDashboardProps {
    supplierId: string;
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-80 w-full" />
        </div>
    );
}

export default function SupplierAnalyticsDashboard({ supplierId }: SupplierAnalyticsDashboardProps) {
    const firestore = useFirestore();

    const { data: benefits, isLoading: benefitsLoading } = useCollectionOnce<Benefit>(
        query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>()), where('ownerId', '==', supplierId))
    );
    const { data: redemptions, isLoading: redemptionsLoading } = useCollectionOnce<BenefitRedemption>(
        query(collection(firestore, 'benefitRedemptions').withConverter(createConverter<BenefitRedemption>()), where('supplierId', '==', supplierId))
    );
    const { data: appointments, isLoading: appointmentsLoading } = useCollectionOnce<Appointment>(
        query(collection(firestore, 'appointments').withConverter(createConverter<Appointment>()), where('supplierId', '==', supplierId))
    );

    const isLoading = benefitsLoading || redemptionsLoading || appointmentsLoading;

    const stats = useMemo(() => {
        if (!benefits || !redemptions || !appointments) return null;
        
        const uniqueUsers = new Set(redemptions.map(r => r.userId));

        return {
            totalBenefits: benefits.length,
            totalRedemptions: redemptions.length,
            totalAppointments: appointments.length,
            uniqueUsers: uniqueUsers.size,
        };
    }, [benefits, redemptions, appointments]);

    if (isLoading) {
        return <LoadingSkeleton />;
    }
    
    if (!stats) {
        return <p>No se pudieron cargar las analíticas.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Beneficios Activos" value={stats.totalBenefits} icon={Gift} />
                <StatCard title="Canjes Totales" value={stats.totalRedemptions} icon={Ticket} />
                <StatCard title="Turnos Reservados" value={stats.totalAppointments} icon={Calendar} />
                <StatCard title="Clientes Únicos" value={stats.uniqueUsers} icon={Users} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Canjes por Día</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <TimeSeriesChart data={redemptions || []} dataKey="redeemedAt" />
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useCollectionOnce, useFirestore, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { Gift, Ticket, Users, Calendar, Star, Heart } from 'lucide-react';
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
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
            </div>
            <Skeleton className="h-80 w-full" />
        </div>
    );
}

export default function SupplierAnalyticsDashboard({ supplierId }: SupplierAnalyticsDashboardProps) {
    const firestore = useFirestore();

    const benefitsQuery = useMemo(() => 
        query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>()), where('ownerId', '==', supplierId)),
        [firestore, supplierId]
    );
    const { data: benefits, isLoading: benefitsLoading } = useCollectionOnce<Benefit>(benefitsQuery);

    const redemptionsQuery = useMemo(() =>
        query(collection(firestore, 'benefitRedemptions').withConverter(createConverter<BenefitRedemption>()), where('supplierId', '==', supplierId)),
        [firestore, supplierId]
    );
    const { data: redemptions, isLoading: redemptionsLoading } = useCollectionOnce<BenefitRedemption>(redemptionsQuery);

    const appointmentsQuery = useMemo(() =>
        query(collection(firestore, 'appointments').withConverter(createConverter<Appointment>()), where('supplierId', '==', supplierId)),
        [firestore, supplierId]
    );
    const { data: appointments, isLoading: appointmentsLoading } = useCollectionOnce<Appointment>(appointmentsQuery);

    const subscribersQuery = useMemo(() =>
        query(collection(firestore, 'roles_supplier', supplierId, 'subscribers')),
        [firestore, supplierId]
    );
    const { data: subscribers, isLoading: subscribersLoading } = useCollectionOnce(subscribersQuery);

    const reviewsQuery = useMemo(() =>
        query(collection(firestore, 'reviews').withConverter(createConverter<any>()), where('supplierId', '==', supplierId)),
        [firestore, supplierId]
    );
    const { data: reviews, isLoading: reviewsLoading } = useCollectionOnce(reviewsQuery);

    const supplierRef = useMemo(() => doc(firestore, 'roles_supplier', supplierId), [firestore, supplierId]);
    const { data: supplierDoc, isLoading: supplierLoading } = useDoc<any>(supplierRef);

    const isLoading = benefitsLoading || redemptionsLoading || appointmentsLoading || subscribersLoading || reviewsLoading || supplierLoading;

    const stats = useMemo(() => {
        if (!benefits || !redemptions || !appointments || !subscribers || !reviews || !supplierDoc) return null;

        const totalBenefitFavorites = benefits.reduce((acc, b) => acc + (b.favoritesCount || 0), 0);
        const totalSupplierFavorites = supplierDoc.favoritesCount || 0;
        
        const avgRating = reviews.length > 0 
            ? reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / reviews.length 
            : 0;

        return {
            totalBenefits: benefits.length,
            totalRedemptions: redemptions.length,
            totalAppointments: appointments.length,
            totalSubscribers: subscribers.length,
            totalFavorites: totalBenefitFavorites + totalSupplierFavorites,
            avgRating: avgRating,
            reviewCount: reviews.length
        };
    }, [benefits, redemptions, appointments, subscribers, reviews, supplierDoc]);

    if (isLoading) {
        return <LoadingSkeleton />;
    }
    
    if (!stats) {
        return <p>No se pudieron cargar las analíticas.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Beneficios Activos" value={stats.totalBenefits} icon={Gift} href="/panel-cluber/benefits" />
                <StatCard title="Canjes Totales" value={stats.totalRedemptions} icon={Ticket} href="/panel-cluber/redemptions" />
                <StatCard title="Suscriptores" value={stats.totalSubscribers} icon={Users} href="/panel-cluber/subscribers" />
                <StatCard title="Turnos Reservados" value={stats.totalAppointments} icon={Calendar} href="/panel-cluber/appointments" />
                <StatCard title="Favoritos Totales" value={stats.totalFavorites} icon={Heart} />
                <StatCard title="Calificación Media" value={`${stats.avgRating.toFixed(1)} / 5`} icon={Star} description={`${stats.reviewCount} reseñas`} />
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

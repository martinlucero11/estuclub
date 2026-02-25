'use client';

import MainLayout from '@/components/layout/main-layout';
import BenefitsGrid from '@/components/perks/perks-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { Benefit, SerializableBenefit } from '@/types/data';
import { makeBenefitSerializable } from '@/types/data';
import { collection, orderBy, query, OrderByDirection, where } from 'firebase/firestore';
import { Suspense, useState, useMemo } from 'react';
import { ArrowDownUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { createConverter } from '@/lib/firestore-converter';

type SortOption = 'createdAt_desc' | 'createdAt_asc';

function BenefitsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function BenefitsList() {
    const firestore = useFirestore();
    const { isUserLoading } = useUser();
    const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get('category');

    const benefitsQuery = useMemo(() => {
        if (!firestore) return null;

        let field: string, direction: OrderByDirection;

        switch (sortOption) {
            case 'createdAt_asc':
                field = 'createdAt';
                direction = 'asc';
                break;
            case 'createdAt_desc':
            default:
                field = 'createdAt';
                direction = 'desc';
                break;
        }
        
        let q = query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>()), orderBy(field, direction));

        if (categoryFilter) {
            q = query(q, where('category', '==', categoryFilter));
        }

        return q;
    }, [firestore, sortOption, categoryFilter]);

    const { data: benefits, isLoading, error } = useCollection(benefitsQuery);
    
    const serializableBenefits: SerializableBenefit[] = useMemo(() => {
        if (!benefits) return [];
        return benefits.map(makeBenefitSerializable);
    }, [benefits]);

    const combinedIsLoading = isUserLoading || isLoading;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                 {categoryFilter && <h2 className="text-2xl font-bold">Categoría: {categoryFilter}</h2>}
                <Select onValueChange={(value: SortOption) => setSortOption(value)} defaultValue={sortOption}>
                    <SelectTrigger className="w-full md:w-[220px] ml-auto">
                        <ArrowDownUp className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt_desc">Más Nuevos</SelectItem>
                        <SelectItem value="createdAt_asc">Más Antiguos</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {combinedIsLoading && <BenefitsGridSkeleton />}

            {error && (
                <p className="text-destructive text-center">
                    Error al cargar los beneficios: {error.message}
                </p>
            )}

            {!combinedIsLoading && !error && <BenefitsGrid benefits={serializableBenefits} />}
        </div>
    );
}

export default function BenefitsPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Todos los Beneficios" />
                 <p className="text-muted-foreground -mt-8 mb-8">
                    Explora todos los descuentos, ofertas y eventos disponibles para ti.
                </p>

                <Suspense fallback={<BenefitsGridSkeleton />}>
                    <BenefitsList />
                </Suspense>
            </div>
        </MainLayout>
    );
}

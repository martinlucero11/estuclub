
'use client';

import MainLayout from '@/components/layout/main-layout';
import PerksGrid from '@/components/perks/perks-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { Perk } from '@/lib/data';
import { collection, orderBy, query, OrderByDirection } from 'firebase/firestore';
import { Suspense, useState, useMemo } from 'react';
import { Gift, ArrowDownUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortOption = 'createdAt_desc' | 'createdAt_asc' | 'points_desc';

function PerksGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function PerksList() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');

    const perksQuery = useMemoFirebase(() => {
        // DO NOT run the query until the user is authenticated and firestore is available.
        if (!user || !firestore) return null;

        let field: string, direction: OrderByDirection;

        switch (sortOption) {
            case 'createdAt_asc':
                field = 'createdAt';
                direction = 'asc';
                break;
            case 'points_desc':
                field = 'points';
                direction = 'desc';
                break;
            case 'createdAt_desc':
            default:
                field = 'createdAt';
                direction = 'desc';
                break;
        }
        return query(collection(firestore, 'benefits'), orderBy(field, direction));
    }, [firestore, sortOption, user]); // Add user to dependency array

    const { data: perks, isLoading: isCollectionLoading, error } = useCollection<Perk>(perksQuery);
    
    // The user is loading, or we have a user but the collection hasn't started loading yet
    const isLoading = isUserLoading || (user && isCollectionLoading);

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Select onValueChange={(value: SortOption) => setSortOption(value)} defaultValue={sortOption}>
                    <SelectTrigger className="w-full md:w-[220px]">
                        <ArrowDownUp className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt_desc">Más Nuevos</SelectItem>
                        <SelectItem value="createdAt_asc">Más Antiguos</SelectItem>
                        <SelectItem value="points_desc">Mayor Puntaje</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {isLoading && <PerksGridSkeleton />}

            {error && (
                <p className="text-destructive text-center">
                    Error al cargar los beneficios: {error.message}
                </p>
            )}

            {!isLoading && !error && <PerksGrid perks={perks || []} />}
        </div>
    );
}

export default function BenefitsPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <header className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Gift className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Todos los Beneficios
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Explora todos los descuentos, ofertas y eventos disponibles para ti.
                    </p>
                </header>

                <Suspense fallback={<PerksGridSkeleton />}>
                    <PerksList />
                </Suspense>
            </div>
        </MainLayout>
    );
}

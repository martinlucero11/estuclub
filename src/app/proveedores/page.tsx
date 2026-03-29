'use client';

import MainLayout from '@/components/layout/main-layout';
import { useCollectionOnce, useFirestore } from '@/firebase';
import { collection, query, orderBy, where, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Briefcase, Heart, ShoppingBag, Wrench, Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { Card } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { CluberCategory, cluberCategories, SupplierProfile } from '@/types/data';
import { Button } from '@/components/ui/button';
import { createConverter } from '@/lib/firestore-converter';
import { getInitials } from '@/lib/utils';

// Mapping new categories to icons
const categoryIcons: Record<CluberCategory, React.ElementType> = {
    Comercio: ShoppingBag,
    Profesional: Briefcase,
    Empresa: Building,
    Emprendimiento: Users,
    Salud: Heart,
    Estética: Briefcase, // using briefcase as a placeholder
    Servicios: Wrench,
};


function ClubersPageSkeleton() {
    return (
        <div className="space-y-6">
             <div className="flex space-x-2 overflow-x-auto pb-2">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-9 w-24 rounded-full" />)}
            </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <Card key={i} className="p-6 flex flex-col items-center justify-center">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="mt-4 h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                </Card>
            ))}
        </div>
        </div>
    );
}

function CluberListPage() {
    const firestore = useFirestore();
    const [activeFilter, setActiveFilter] = useState<CluberCategory | 'Todos'>('Todos');

    const clubersQuery = useMemo(
        () => {
            if (!firestore) return null;
            return query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()), orderBy('name'), limit(50));
        },
        [firestore]
    );

    const { data: allClubers, isLoading, error } = useCollectionOnce(clubersQuery);
    
    const clubers = useMemo(() => {
        if (!allClubers) return [];
        if (activeFilter === 'Todos') return allClubers;
        return allClubers.filter(cluber => cluber.type === activeFilter);
    }, [allClubers, activeFilter]);

     if (isLoading) {
        return <ClubersPageSkeleton />;
    }

    if (error) {
        return <p className="text-destructive">Error al cargar los Clubers: {error.message}</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                <Button
                    variant={activeFilter === 'Todos' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setActiveFilter('Todos')}
                >
                    Todos
                </Button>
                {cluberCategories.map(category => (
                    <Button
                        key={category}
                        variant={activeFilter === category ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full whitespace-nowrap"
                        onClick={() => setActiveFilter(category)}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {clubers && clubers.length === 0 ? (
                <div className="py-10 max-w-4xl mx-auto">
                    <PremiumEmptyState
                        icon={Search}
                        title="No encontramos Clubers"
                        description={activeFilter === 'Todos' ? 'Aún no se han registrado Clubers.' : `No hay Clubers en esta categoría. Mientras tanto, ¡ayuda a nuestro gatito!`}
                        showGame={true}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-stagger">
                    {clubers?.map(cluber => {
                        const TypeIcon = categoryIcons[cluber.type] || Users;
                        const cluberInitials = getInitials(cluber.name);

                        return (
                            <Link key={cluber.id} href={`/proveedores/view?slug=${cluber.slug}${cluber.deliveryEnabled ? '&tab=catalog' : ''}`} className="group block">
                                <Card className="flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 active:scale-[0.97]">
                                    <Avatar className="h-24 w-24 border-2 border-border group-hover:border-primary transition-colors">
                                        <AvatarImage src={cluber.logoUrl} alt={cluber.name} className="object-cover" />
                                        <AvatarFallback className="bg-muted text-3xl font-semibold text-muted-foreground">
                                            {cluberInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="mt-4 font-bold text-lg text-foreground">{cluber.name}</h3>
                                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                        <TypeIcon className="h-4 w-4" />
                                        <p className="capitalize">{cluber.type}</p>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}


export default function ClubersPage() {
    return (
        <MainLayout>
            <BackButton />
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Clubers" />
                <p className="text-muted-foreground -mt-8 mb-8">
                    Explora los comercios, profesionales y empresas asociadas.
                </p>

                <div className="p-6">
                    <CluberListPage />
                </div>
            </div>
        </MainLayout>
    )
}

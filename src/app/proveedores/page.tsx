
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useCollectionOnce, useFirestore } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Briefcase, Heart, ShoppingBag, Wrench, Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { CluberCategory, cluberCategories, SupplierProfile } from '@/types/data';
import { Button } from '@/components/ui/button';
import { createConverter } from '@/lib/firestore-converter';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 flex flex-col items-center justify-center">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="mt-4 h-6 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                    <Skeleton className="mt-2 h-4 w-3/4" />
                    <Skeleton className="mt-4 h-10 w-full rounded-full" />
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
            return query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()), orderBy('name'));
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
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
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
                <EmptyState
                    icon={Search}
                    title="No se encontraron Clubers"
                    description={activeFilter === 'Todos' ? 'Aún no se han registrado Clubers.' : `No hay Clubers en la categoría '${activeFilter}'.`}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubers?.map(cluber => {
                        const TypeIcon = categoryIcons[cluber.type] || Users;
                        
                        return (
                            <Link key={cluber.id} href={`/proveedores/${cluber.slug}`} className="group block h-full">
                                <Card className="overflow-hidden rounded-2xl border hover:border-primary transition-all duration-300 hover:shadow-xl flex flex-col h-full bg-card">
                                    <div className="relative overflow-hidden aspect-[4/3] bg-muted">
                                        <Avatar className="h-full w-full rounded-none">
                                            <AvatarImage src={cluber.logoUrl || undefined} alt={cluber.name} className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500" />
                                            <AvatarFallback className="rounded-none bg-muted flex items-center justify-center">
                                                <TypeIcon className="h-16 w-16 text-muted-foreground/50" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute top-3 right-3">
                                            <Badge variant="secondary" className="capitalize backdrop-blur-sm bg-background/70">{cluber.type}</Badge>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">{cluber.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2 flex-grow mb-4">{cluber.description}</p>
                                        <div className="w-full mt-auto">
                                            <Button className="w-full" variant="secondary" tabIndex={-1}>Ver Perfil</Button>
                                        </div>
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

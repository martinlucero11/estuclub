
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Briefcase, Heart, ShoppingBag, Wrench, Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { CluberCategory, cluberCategories, SupplierProfile } from '@/types/data';
import { Button } from '@/components/ui/button';

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
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="mt-4 h-5 w-3/4" />
                    <Skeleton className="mt-1 h-4 w-1/2" />
                </Card>
            ))}
        </div>
        </div>
    );
}

function CluberListPage() {
    const firestore = useFirestore();
    const [activeFilter, setActiveFilter] = useState<CluberCategory | 'Todos'>('Todos');

    const clubersQuery = useMemoFirebase(
        () => {
            const baseQuery = collection(firestore, 'roles_supplier');
            if (activeFilter === 'Todos') {
                return query(baseQuery, orderBy('name'));
            }
            return query(baseQuery, where('type', '==', activeFilter), orderBy('name'));
        },
        [firestore, activeFilter]
    );

    const { data: clubers, isLoading, error } = useCollection<SupplierProfile>(clubersQuery);
    
     if (isLoading) {
        return <ClubersPageSkeleton />;
    }

    if (error) {
        return <p className="text-destructive">Error al cargar los Clubers.</p>;
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
                        const cluberInitials = cluber.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                        return (
                            <Link key={cluber.id} href={`/proveedores/${cluber.slug}`} className="group block h-full">
                                <Card className="flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                                    <Avatar className="h-20 w-20 border-2 border-border group-hover:border-primary transition-colors p-2">
                                        <AvatarImage src={cluber.logoUrl || undefined} alt={cluber.name} className="object-contain" />
                                        <AvatarFallback className="bg-muted text-xl font-semibold text-muted-foreground">
                                            {cluberInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="mt-4 font-bold text-lg text-foreground">{cluber.name}</h3>
                                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                        <TypeIcon className="h-4 w-4" />
                                        <p className="capitalize">{cluber.type}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cluber.description}</p>
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

                <CluberListPage />
            </div>
        </MainLayout>
    )
}

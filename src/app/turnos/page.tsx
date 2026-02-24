
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, Briefcase, Heart, ShoppingBag, Wrench, Search, Users, CalendarDays } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { CluberCategory, SupplierProfile } from '@/types/data';
import { useMemo } from 'react';
import { createConverter } from '@/lib/firestore-converter';

const categoryIcons: Record<CluberCategory, React.ElementType> = {
    Comercio: ShoppingBag,
    Profesional: Briefcase,
    Empresa: Building,
    Emprendimiento: Users,
    Salud: Heart,
    Estética: Briefcase,
    Servicios: Wrench,
};

function TurnosPageSkeleton() {
    return (
        <div className="space-y-6">
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

function CluberList() {
    const firestore = useFirestore();
    
    const clubersQuery = useMemo(
        () => {
            return query(
                collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()), 
                where('appointmentsEnabled', '==', true), 
                orderBy('name')
            );
        },
        [firestore]
    );

    const { data: clubers, isLoading, error } = useCollection(clubersQuery);
    
    if (isLoading) {
        return <TurnosPageSkeleton />;
    }

    if (error) {
        console.error("Error real fetching clubers con turnos:", error);
        return <p className="text-destructive text-center">Error al cargar los Clubers: {error.message}</p>;
    }

    return (
        <div className="space-y-6">
            {clubers && clubers.length === 0 ? (
                <EmptyState
                    icon={CalendarDays}
                    title="No hay turnos disponibles"
                    description="Ningún Cluber tiene habilitada la reserva de turnos en este momento."
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubers?.map(cluber => {
                        const TypeIcon = categoryIcons[cluber.type] || Users;
                        const cluberInitials = cluber.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

                        return (
                            <Link key={cluber.id} href={`/proveedores/${cluber.slug}`} className="group block h-full">
                                <Card className="flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                                    <Avatar className="h-20 w-20 border-2 border-border group-hover:border-primary transition-colors">
                                        <AvatarImage src={cluber.logoUrl} alt={cluber.name} className="object-cover" />
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

export default function TurnosPage() {
    return (
        <MainLayout>
             <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Solicitar Turno" />
                <p className="text-muted-foreground -mt-8 mb-8">
                    Selecciona un Cluber para ver sus servicios y reservar un turno.
                </p>
                <CluberList />
            </div>
        </MainLayout>
    )
}

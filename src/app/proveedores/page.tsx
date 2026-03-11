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
        () => query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()), where('isVisible', '==', true), orderBy('name')),
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
        // Proactive error handling for missing Firestore index.
        if ('code' in error && error.code === 'failed-precondition') {
            const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'estuclub'; // Using a fallback just in case
            const indexUrl = `https://console.firebase.google.com/project/${projectId}/firestore/indexes/composite-create?collectionId=roles_supplier&field[0].fieldPath=isVisible&field[0].order=ASCENDING&field[1].fieldPath=name&field[1].order=ASCENDING`;
            return (
                <Card className="border-destructive">
                     <CardHeader>
                        <CardTitle className="text-destructive">Error de Configuración de Base de Datos</CardTitle>
                        <CardDescription className="text-destructive">
                            La consulta para mostrar los Clubers requiere un índice compuesto en Firestore que no ha sido creado.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm font-medium">Para solucionar este problema, un administrador del proyecto de Firebase debe crear el índice requerido.</p>
                        <a href={indexUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline font-mono break-all text-sm hover:text-primary/80">
                            Crear Índice en Firebase Console
                        </a>
                        <p className="mt-4 text-xs text-muted-foreground">Una vez en la página, simplemente haz clic en "Crear índice" y espera unos minutos a que se active. Luego, recarga esta página.</p>
                    </CardContent>
                </Card>
            );
        }
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
                        const initials = getInitials(cluber.name);

                        return (
                            <Link key={cluber.id} href={`/proveedores/${cluber.slug}`} className="group block h-full">
                                <Card className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 dark:border-slate-800 p-6 flex flex-col items-center text-center transition-all hover:shadow-lg h-full">
                                    <div className="w-24 h-24 rounded-full border-4 border-[#d83762]/10 mb-4 overflow-hidden">
                                        <Avatar className="h-full w-full">
                                            <AvatarImage src={cluber.logoUrl || undefined} alt={cluber.name} className="object-cover" />
                                            <AvatarFallback className="bg-muted text-xl font-semibold text-muted-foreground">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{cluber.name}</h3>
                                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#d83762]/10 text-[#d83762] capitalize">
                                        <TypeIcon className="h-4 w-4 mr-2" />
                                        {cluber.type}
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow">{cluber.description}</p>
                                    <div className="w-full mt-auto py-2 rounded-full bg-[#d83762] text-white font-medium text-sm transition-all hover:bg-[#c22f55]">
                                        Ver Perfil
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

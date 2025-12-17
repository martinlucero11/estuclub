
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Building, Briefcase, Church, Scale, User, Search, ShoppingBasket } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SupplierProfile {
    id: string;
    name: string;
    type: 'Institucion' | 'Club' | 'Iglesia' | 'Comercio' | 'Estado';
    slug: string;
    logoUrl?: string;
    description?: string;
}

const typeIcons = {
    Institucion: Building,
    Club: Briefcase,
    Iglesia: Church,
    Comercio: ShoppingBasket,
    Estado: Scale,
};

function SuppliersPageSkeleton() {
    return (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="flex flex-col">
                    <CardContent className="p-4 flex items-center gap-4">
                         <Skeleton className="h-16 w-16 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function SupplierListPage() {
    const firestore = useFirestore();

    const suppliersQuery = useMemoFirebase(
        () => query(collection(firestore, 'roles_supplier'), orderBy('name')),
        [firestore]
    );

    const { data: suppliers, isLoading, error } = useCollection<SupplierProfile>(suppliersQuery);

     if (isLoading) {
        return <SuppliersPageSkeleton />;
    }

    if (error) {
        return <p className="text-destructive">Error al cargar los proveedores.</p>;
    }

    if (!suppliers || suppliers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">No hay proveedores</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Aún no se han registrado proveedores en la plataforma.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(supplier => {
                const TypeIcon = typeIcons[supplier.type] || User;

                return (
                    <Link key={supplier.id} href={`/proveedores/${supplier.slug}`} className="w-full">
                        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex items-center gap-4">
                                 <Avatar className="h-16 w-16 rounded-lg">
                                    <AvatarImage src={supplier.logoUrl} alt={supplier.name} className="object-cover" />
                                    <AvatarFallback className="rounded-lg">
                                        <TypeIcon className="h-8 w-8 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg line-clamp-1">{supplier.name}</h3>
                                    <p className="text-sm text-muted-foreground capitalize">{supplier.type}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
}


export default function ProveedoresPage() {
    return (
        <MainLayout>
             <div className="flex-1 space-y-8 p-4 md:p-8">
                <header className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Store className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Proveedores
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Explora los comercios, instituciones y clubes asociados.
                    </p>
                </header>

                <SupplierListPage />
            </div>
        </MainLayout>
    )
}

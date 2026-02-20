
'use client';

import MainLayout from '@/components/layout/main-layout';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Building, Briefcase, Church, Scale, User, Search, ShoppingBasket } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';

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
                <Card key={i} className="p-6 flex flex-col items-center justify-center">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="mt-4 h-5 w-3/4" />
                    <Skeleton className="mt-1 h-4 w-1/2" />
                </Card>
            ))}
        </div>
    );
}

function SupplierListPage() {
    const firestore = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');

    const suppliersQuery = useMemoFirebase(
        () => query(collection(firestore, 'roles_supplier'), orderBy('name')),
        [firestore]
    );

    const { data: suppliers, isLoading, error } = useCollection<SupplierProfile>(suppliersQuery);
    
    const filteredSuppliers = useMemo(() => {
        if (!suppliers) return [];
        return suppliers.filter(supplier =>
            supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [suppliers, searchTerm]);


     if (isLoading) {
        return <SuppliersPageSkeleton />;
    }

    if (error) {
        return <p className="text-destructive">Error al cargar los proveedores.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Buscar un supplier..."
                    className="w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredSuppliers.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="No se encontraron suppliers"
                    description={searchTerm ? 'Intenta con otro término de búsqueda.' : 'Aún no se han registrado suppliers.'}
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuppliers.map(supplier => {
                        const TypeIcon = typeIcons[supplier.type] || User;
                        const supplierInitials = supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                        return (
                            <Link key={supplier.id} href={`/proveedores/${supplier.slug}`} className="group block h-full">
                                <Card className="flex h-full flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                                    <Avatar className="h-20 w-20 border-2 border-border group-hover:border-primary transition-colors">
                                        <AvatarImage src={supplier.logoUrl} alt={supplier.name} className="object-cover" />
                                        <AvatarFallback className="bg-muted text-xl font-semibold text-muted-foreground">
                                            {supplierInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="mt-4 font-bold text-lg text-foreground">{supplier.name}</h3>
                                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                        <TypeIcon className="h-4 w-4" />
                                        <p className="capitalize">{supplier.type}</p>
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


export default function SuppliersPage() {
    return (
        <MainLayout>
             <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Suppliers" />
                <p className="text-muted-foreground -mt-8 mb-8">
                    Explora los comercios, instituciones y clubes asociados.
                </p>

                <SupplierListPage />
            </div>
        </MainLayout>
    )
}

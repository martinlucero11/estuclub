
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Briefcase, Church, Scale, ShoppingBasket, User, Ticket, ConciergeBell } from 'lucide-react';
import PerksGrid from '@/components/perks/perks-grid';
import { Perk } from '@/lib/data';
import ServiceList from '@/components/supplier/service-list';
import type { Service } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface SupplierProfile {
    id: string;
    name: string;
    type: 'Institucion' | 'Club' | 'Iglesia' | 'Comercio' | 'Estado';
    slug: string;
    logoUrl?: string;
    description?: string;
    allowsBooking?: boolean;
}

const typeIcons = {
    Institucion: Building,
    Club: Briefcase,
    Iglesia: Church,
    Comercio: ShoppingBasket,
    Estado: Scale,
};


function ProfileSkeleton() {
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="space-y-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-48 w-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function SupplierProfileContent({ slug }: { slug: string }) {
    const firestore = useFirestore();
    const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch supplier data
    useEffect(() => {
        const fetchSupplier = async () => {
            if (!slug) return;
            setIsLoading(true);
            try {
                const q = query(collection(firestore, 'roles_supplier'), where('slug', '==', slug), limit(1));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    setError('No se encontró el proveedor.');
                } else {
                    const supplierDoc = querySnapshot.docs[0];
                    setSupplier({ id: supplierDoc.id, ...supplierDoc.data() } as SupplierProfile);
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar el proveedor.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSupplier();
    }, [firestore, slug]);
    
    const benefitsQuery = useMemoFirebase(() => {
        if (!supplier) return null;
        return query(collection(firestore, 'benefits'), where('ownerId', '==', supplier.id));
    }, [supplier, firestore]);
    const { data: benefits, isLoading: benefitsLoading } = useCollection<Perk>(benefitsQuery);
    
    const servicesQuery = useMemoFirebase(() => {
        if (!supplier) return null;
        return query(collection(firestore, `roles_supplier/${supplier.id}/services`));
    }, [supplier, firestore]);
    const { data: services, isLoading: servicesLoading } = useCollection<Service>(servicesQuery);

    if (isLoading) {
        return <ProfileSkeleton />;
    }
    
    if (error) {
         return (
            <div className="flex items-center justify-center pt-16">
                 <Alert variant="destructive" className="max-w-lg">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    if (!supplier) {
        return (
            <div className="flex items-center justify-center pt-16">
                 <Alert variant="destructive" className="max-w-lg">
                    <AlertTitle>Proveedor no encontrado</AlertTitle>
                    <AlertDescription>No se pudo encontrar un proveedor con la URL especificada.</AlertDescription>
                </Alert>
            </div>
        )
    }

    const TypeIcon = typeIcons[supplier.type] || User;

    return (
        <div className="space-y-8 p-4 md:p-8">
            <header className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="h-32 w-32 rounded-full border-4 border-primary">
                    <AvatarImage src={supplier.logoUrl} alt={supplier.name} />
                    <AvatarFallback className="text-5xl">
                       {supplier.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                         <TypeIcon className="h-6 w-6 text-muted-foreground" />
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                            {supplier.name}
                        </h1>
                    </div>
                    <p className="mt-2 text-muted-foreground max-w-xl">{supplier.description || 'Este proveedor aún no ha añadido una descripción.'}</p>
                </div>
            </header>

             <Tabs defaultValue="benefits" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="benefits">
                        <Ticket className="mr-2 h-4 w-4" />
                        Beneficios
                    </TabsTrigger>
                     {supplier.allowsBooking && (
                        <TabsTrigger value="services">
                            <ConciergeBell className="mr-2 h-4 w-4" />
                            Servicios
                        </TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="benefits" className="mt-6">
                    {benefitsLoading ? <Skeleton className="h-48 w-full" /> : <PerksGrid perks={benefits || []} />}
                </TabsContent>
                {supplier.allowsBooking && (
                    <TabsContent value="services" className="mt-6">
                        {servicesLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        ) : (
                            <ServiceList services={services || []} />
                        )}
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

export default function SupplierProfilePage({ params }: { params: { slug: string } }) {
    return (
        <MainLayout>
            <SupplierProfileContent slug={params.slug} />
        </MainLayout>
    );
}

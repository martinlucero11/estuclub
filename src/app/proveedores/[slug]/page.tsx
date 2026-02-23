'use client';

import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, getDocs, doc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Briefcase, Wrench, Heart, Users, ShoppingBag } from 'lucide-react';
import PerksGrid from '@/components/perks/perks-grid';
import { Perk, makePerkSerializable, SerializablePerk, Service, Availability } from '@/lib/data';
import type { CluberCategory, SupplierProfile } from '@/types/data';
import Image from 'next/image';
import ServiceList from '@/components/supplier/service-list';
import { Separator } from '@/components/ui/separator';

const categoryIcons: Record<CluberCategory, React.ElementType> = {
    Comercio: ShoppingBag,
    Profesional: Briefcase,
    Empresa: Building,
    Emprendimiento: Users,
    Salud: Heart,
    Estética: Briefcase,
    Servicios: Wrench,
};

function ProfileSkeleton() {
    return (
        <div>
            {/* Skeleton for the new minimalist header */}
            <div className="flex flex-col items-center pt-12 pb-8 bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-background border-b">
                <Skeleton className="w-32 h-32 rounded-full shadow-xl mb-4" />
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="px-6 py-8">
                <Skeleton className="h-7 w-48 mb-4" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function CluberProfileContent({ slug }: { slug: string }) {
    const firestore = useFirestore();
    const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
    const [isLoadingSupplier, setIsLoadingSupplier] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSupplier = async () => {
            if (!slug) return;
            setIsLoadingSupplier(true);
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
                setIsLoadingSupplier(false);
            }
        };
        fetchSupplier();
    }, [firestore, slug]);
    
    // CRITICAL FIX: Changed collection from 'benefits' to 'perks' to match data schema.
    const perksQuery = useMemoFirebase(() => {
        if (!supplier) return null;
        return query(collection(firestore, 'perks'), where('supplierId', '==', supplier.id), where('active', '==', true));
    }, [supplier, firestore]);

    const { data: perks, isLoading: perksLoading } = useCollection<Perk>(perksQuery);

    const servicesQuery = useMemoFirebase(() => {
        if (!supplier) return null;
        return query(collection(firestore, `roles_supplier/${supplier.id}/services`));
    }, [supplier, firestore]);
    const { data: services } = useCollection<Service>(servicesQuery);

    const availabilityRef = useMemoFirebase(() => {
        if (!supplier) return null;
        return doc(firestore, `roles_supplier/${supplier.id}/availability/schedule`);
    }, [supplier, firestore]);
    const { data: availability } = useDoc<Availability>(availabilityRef);

    const serializablePerks: SerializablePerk[] = useMemo(() => {
        if (!perks) return [];
        return perks.map(makePerkSerializable);
    }, [perks]);

    if (isLoadingSupplier) {
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

    const TypeIcon = categoryIcons[supplier.type] || Users;
    const supplierInitial = supplier.name.charAt(0).toUpperCase();

    return (
        <div className="flex flex-col">
            {/* UI/UX FIX: New premium, minimalist header without cover photo */}
            <header className="flex flex-col items-center text-center pt-12 pb-8 bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-background border-b">
                <div className="relative w-32 h-32 rounded-full border-4 border-background shadow-xl overflow-hidden mb-4">
                    <Avatar className="h-full w-full rounded-none">
                        <AvatarImage
                            src={supplier.logoUrl || undefined}
                            alt={supplier.name}
                            className="object-cover"
                        />
                        <AvatarFallback className="rounded-none bg-transparent text-4xl font-bold text-muted-foreground">
                            {supplierInitial}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                    {supplier.name}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground font-medium mt-1">
                    <TypeIcon className="h-4 w-4" />
                    <p className="capitalize">{supplier.type}</p>
                </div>
            </header>
            
            <main className="w-full max-w-5xl mx-auto">
                <div className="px-6 py-8">
                    <p className="text-muted-foreground max-w-xl mx-auto text-center">{supplier.description || 'Este proveedor aún no ha añadido una descripción.'}</p>
                </div>

                {/* Active Benefits Section */}
                {(perks && perks.length > 0) && (
                    <section id="benefits-section" className="px-6 py-8 scroll-mt-20">
                        <h2 className="text-2xl font-bold mb-4 text-center">Beneficios Activos</h2>
                        {perksLoading ? <Skeleton className="h-48 w-full" /> : <PerksGrid perks={serializablePerks} />}
                    </section>
                )}

                {/* Available Services Section */}
                {supplier.appointmentsEnabled && services && services.length > 0 && (
                    <>
                        <Separator className="my-4" />
                        <section id="services-section" className="px-6 py-8 scroll-mt-20">
                            <h2 className="text-2xl font-bold mb-4 text-center">Servicios Disponibles</h2>
                            <ServiceList 
                                services={services || []} 
                                availability={availability} 
                                supplierId={supplier.id} 
                                allowsBooking={!!supplier.appointmentsEnabled}
                            />
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default function CluberProfilePage({ params }: { params: { slug: string } }) {
    return (
        <MainLayout>
            <CluberProfileContent slug={params.slug} />
        </MainLayout>
    );
}

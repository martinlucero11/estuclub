
'use client';

import { useCollectionOnce, useFirestore, useDoc, useUser } from '@/firebase';
import { collection, query, where, limit, getDocs, doc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Briefcase, Wrench, Heart, Users, ShoppingBag, Gift, Search, Server } from 'lucide-react';
import BenefitsGrid from '@/components/perks/perks-grid';
import { makeBenefitSerializable } from '@/lib/data';
import type { Benefit, SerializableBenefit, Service, Availability, CluberCategory, SupplierProfile } from '@/types/data';
import Image from 'next/image';
import ServiceList from '@/components/supplier/service-list';
import { Separator } from '@/components/ui/separator';
import { createConverter } from '@/lib/firestore-converter';
import { getInitials } from '@/lib/utils';
import SubscribeButton from '@/components/supplier/subscribe-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';

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
    const { user } = useUser();
    const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
    const [isLoadingSupplier, setIsLoadingSupplier] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSupplier = async () => {
            if (!slug || !firestore) return;
            setIsLoadingSupplier(true);
            try {
                const q = query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()), where('slug', '==', slug), limit(1));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    setError('No se encontró el proveedor.');
                } else {
                    const supplierDoc = querySnapshot.docs[0];
                    setSupplier(supplierDoc.data());
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
    
    const benefitsQuery = useMemo(() => {
        if (!supplier || !firestore) return null;
        return query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>()), where('ownerId', '==', supplier.id), where('isVisible', '==', true));
    }, [supplier, firestore]);

    const { data: benefits, isLoading: benefitsLoading } = useCollectionOnce(benefitsQuery);

    const servicesQuery = useMemo(() => {
        if (!supplier || !firestore) return null;
        return query(collection(firestore, `roles_supplier/${supplier.id}/services`).withConverter(createConverter<Service>()));
    }, [supplier, firestore]);
    const { data: services } = useCollectionOnce(servicesQuery);

    const availabilityRef = useMemo(() => {
        if (!supplier || !firestore) return null;
        return doc(firestore, `roles_supplier/${supplier.id}/availability/schedule`);
    }, [supplier, firestore]);
    const { data: availability } = useDoc<Availability>(availabilityRef);

    const serializableBenefits: SerializableBenefit[] = useMemo(() => {
        if (!benefits) return [];
        return benefits.map(makeBenefitSerializable);
    }, [benefits]);

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
    const supplierInitials = getInitials(supplier.name);
    const isOwnProfile = user?.uid === supplier.id;

    const hasBenefits = benefits && benefits.length > 0;
    const hasServices = supplier.appointmentsEnabled && services && services.length > 0;
    
    // Determine default tab
    const defaultTab = hasBenefits ? "benefits" : hasServices ? "services" : "benefits";

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
                            {supplierInitials}
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
                 <div className="mt-4">
                    {!isOwnProfile && <SubscribeButton supplierId={supplier.id} />}
                </div>
            </header>
            
            <main className="w-full max-w-5xl mx-auto px-4 py-8">
                {supplier.description && (
                     <p className="text-muted-foreground max-w-2xl mx-auto text-center mb-8">{supplier.description}</p>
                )}

                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mx-auto max-w-md">
                        <TabsTrigger value="benefits" disabled={!hasBenefits}>Beneficios</TabsTrigger>
                        {hasServices && <TabsTrigger value="services">Turnos y Servicios</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="benefits" className="mt-6">
                         {benefitsLoading ? <Skeleton className="h-48 w-full" /> : (
                            hasBenefits ? <BenefitsGrid benefits={serializableBenefits} /> : <EmptyState icon={Gift} title="Sin Beneficios" description="Este Cluber no tiene beneficios activos en este momento."/>
                         )}
                    </TabsContent>
                    {hasServices && (
                        <TabsContent value="services" className="mt-6">
                            <ServiceList 
                                services={services || []} 
                                availability={availability} 
                                supplierId={supplier.id} 
                                allowsBooking={!!supplier.appointmentsEnabled}
                            />
                        </TabsContent>
                    )}
                </Tabs>
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

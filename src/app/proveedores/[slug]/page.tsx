
'use client';

import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, getDocs, doc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Briefcase, Wrench, Heart, Users, ShoppingBag, CalendarDays, BadgeHelp } from 'lucide-react';
import PerksGrid from '@/components/perks/perks-grid';
import { Perk, makePerkSerializable, SerializablePerk, Service, Availability } from '@/lib/data';
import type { CluberCategory, SupplierProfile } from '@/types/data';
import Image from 'next/image';
import ServiceList from '@/components/supplier/service-list';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
            <header className="relative">
                <Skeleton className="w-full h-48 md:h-64 bg-slate-100 dark:bg-slate-800 rounded-b-3xl" />
                <div className="absolute -bottom-12 left-6 z-10">
                    <Skeleton className="w-28 h-28 rounded-full border-4 border-background" />
                </div>
            </header>
            <div className="pt-16 px-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48 mt-2" />
                <Skeleton className="h-12 w-full mt-4" />
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
    )
}

function CluberProfileContent({ slug }: { slug: string }) {
    const firestore = useFirestore();
    const [cluber, setCluber] = useState<SupplierProfile | null>(null);
    const [isLoadingCluber, setIsLoadingCluber] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCluber = async () => {
            if (!slug) return;
            setIsLoadingCluber(true);
            try {
                const q = query(collection(firestore, 'roles_supplier'), where('slug', '==', slug), limit(1));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    setError('No se encontró el proveedor.');
                } else {
                    const cluberDoc = querySnapshot.docs[0];
                    setCluber({ id: cluberDoc.id, ...cluberDoc.data() } as SupplierProfile);
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar el proveedor.');
            } finally {
                setIsLoadingCluber(false);
            }
        };
        fetchCluber();
    }, [firestore, slug]);
    
    const benefitsQuery = useMemoFirebase(() => {
        if (!cluber) return null;
        return query(collection(firestore, 'benefits'), where('supplierId', '==', cluber.id), where('status', '==', 'active'));
    }, [cluber, firestore]);

    const { data: benefits, isLoading: benefitsLoading } = useCollection<Perk>(benefitsQuery);

    const servicesQuery = useMemoFirebase(() => {
        if (!cluber) return null;
        return query(collection(firestore, `roles_supplier/${cluber.id}/services`));
    }, [cluber, firestore]);
    const { data: services } = useCollection<Service>(servicesQuery);

    const availabilityRef = useMemoFirebase(() => {
        if (!cluber) return null;
        return doc(firestore, `roles_supplier/${cluber.id}/availability/schedule`);
    }, [cluber, firestore]);
    const { data: availability } = useDoc<Availability>(availabilityRef);

    const serializableBenefits: SerializablePerk[] = useMemo(() => {
        if (!benefits) return [];
        return benefits.map(makePerkSerializable);
    }, [benefits]);

    if (isLoadingCluber) {
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
    
    if (!cluber) {
        return (
            <div className="flex items-center justify-center pt-16">
                 <Alert variant="destructive" className="max-w-lg">
                    <AlertTitle>Proveedor no encontrado</AlertTitle>
                    <AlertDescription>No se pudo encontrar un proveedor con la URL especificada.</AlertDescription>
                </Alert>
            </div>
        )
    }

    const TypeIcon = categoryIcons[cluber.type] || Users;
    const supplierInitial = cluber.name.charAt(0).toUpperCase();

    return (
        <div>
            <header className="relative">
                <div className="relative w-full h-48 md:h-64 bg-slate-100 dark:bg-slate-800 rounded-b-3xl overflow-hidden">
                    {cluber.coverPhotoUrl && (
                         <Image
                            src={cluber.coverPhotoUrl}
                            alt={`${cluber.name} cover photo`}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    )}
                </div>
                <div className="absolute -bottom-12 left-6 w-28 h-28 rounded-full border-4 border-background bg-background shadow-xl overflow-hidden z-10 flex items-center justify-center">
                    <Avatar className="h-full w-full rounded-none">
                         <AvatarImage
                            src={cluber.logoUrl || undefined}
                            alt={cluber.name}
                            className="object-contain"
                         />
                        <AvatarFallback className="rounded-none bg-transparent text-3xl font-bold text-muted-foreground">
                            {supplierInitial}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </header>
            
            <div className="pt-16 px-6 space-y-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {cluber.name}
                    </h1>
                     <div className="flex items-center gap-2 text-muted-foreground">
                         <TypeIcon className="h-4 w-4" />
                        <p className="capitalize">{cluber.type}</p>
                    </div>
                </div>
                <p className="text-muted-foreground max-w-xl">{cluber.description || 'Este proveedor aún no ha añadido una descripción.'}</p>
            </div>
            
            {cluber.canCreateAppointments && (
                <div className="px-6 pt-4">
                    <Button asChild size="lg" className="w-full sm:w-auto">
                        <Link href="#booking-section">
                            <CalendarDays className="mr-2 h-5 w-5" />
                            Solicitar Turno
                        </Link>
                    </Button>
                </div>
            )}

             <div className="px-6 py-8">
                 <h2 className="text-2xl font-bold mb-4">Beneficios Activos</h2>
                {benefitsLoading ? <Skeleton className="h-48 w-full" /> : <PerksGrid perks={serializableBenefits} />}
            </div>

            {cluber.canCreateAppointments && availability && services && (
                 <>
                    <Separator className="my-8" />
                    <div id="booking-section" className="px-6 py-8 scroll-mt-20">
                        <h2 className="text-2xl font-bold mb-4">Reservar un Turno</h2>
                        <ServiceList 
                            services={services} 
                            availability={availability} 
                            supplierId={cluber.id} 
                            allowsBooking={!!cluber.canCreateAppointments}
                        />
                    </div>
                 </>
            )}
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


'use client';

import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, getDocs, doc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Briefcase, Wrench, Heart, Users, ShoppingBag, CalendarDays } from 'lucide-react';
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
            <div className="relative mb-16">
                <Skeleton className="h-48 w-full" />
                <div className="absolute -bottom-16 left-6">
                    <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
                </div>
            </div>
            <div className="px-6 py-4 space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-12 w-full" />
            </div>
             <div className="px-6 py-8">
                 <Skeleton className="h-7 w-48 mb-4" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-48 w-full rounded-2xl" />
                        </div>
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

    // Fetch cluber data
    useEffect(() => {
        const fetchCluber = async () => {
            if (!slug) return;
            setIsLoadingCluber(true);
            try {
                const q = query(collection(firestore, 'roles_supplier'), where('slug', '==', slug), limit(1));
                const querySnapshot = await getDocs(q);
                if (querySnapshot.empty) {
                    setError('No se encontró el Cluber.');
                } else {
                    const cluberDoc = querySnapshot.docs[0];
                    setCluber({ id: cluberDoc.id, ...cluberDoc.data() } as SupplierProfile);
                }
            } catch (err) {
                console.error(err);
                setError('Error al cargar el Cluber.');
            } finally {
                setIsLoadingCluber(false);
            }
        };
        fetchCluber();
    }, [firestore, slug]);
    
    const benefitsQuery = useMemoFirebase(() => {
        if (!cluber) return null;
        return query(collection(firestore, 'benefits'), where('ownerId', '==', cluber.id), where('active', '==', true));
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
                    <AlertTitle>Cluber no encontrado</AlertTitle>
                    <AlertDescription>No se pudo encontrar un Cluber con la URL especificada.</AlertDescription>
                </Alert>
            </div>
        )
    }

    const TypeIcon = categoryIcons[cluber.type] || Users;
    const coverPhoto = cluber.coverPhotoUrl || 'https://images.unsplash.com/photo-1522252234503-e356532cafd5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80';

    return (
        <div>
            <header className="relative mb-16">
                <div className="h-48 w-full bg-muted">
                    <Image src={coverPhoto} alt={`${cluber.name} cover photo`} fill className="object-cover" />
                </div>
                 <div className="absolute -bottom-16 left-6">
                    <Avatar className="h-32 w-32 rounded-full border-4 border-background bg-background">
                        <AvatarImage src={cluber.logoUrl} alt={cluber.name} />
                        <AvatarFallback className="text-5xl">
                           {cluber.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </header>
            
            <div className="px-6 py-4 space-y-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {cluber.name}
                    </h1>
                     <div className="flex items-center gap-2 text-muted-foreground">
                         <TypeIcon className="h-4 w-4" />
                        <p className="capitalize">{cluber.type}</p>
                    </div>
                </div>
                <p className="text-muted-foreground max-w-xl">{cluber.description || 'Este Cluber aún no ha añadido una descripción.'}</p>
            </div>
            
            {cluber.appointmentsEnabled && (
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

            {cluber.appointmentsEnabled && availability && services && (
                 <>
                    <Separator className="my-8" />
                    <div id="booking-section" className="px-6 py-8 scroll-mt-20">
                        <h2 className="text-2xl font-bold mb-4">Reservar un Turno</h2>
                        <ServiceList 
                            services={services} 
                            availability={availability} 
                            supplierId={cluber.id} 
                            allowsBooking={!!cluber.appointmentsEnabled}
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

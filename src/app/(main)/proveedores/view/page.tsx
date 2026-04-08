'use client';

import { useCollectionOnce, useFirestore, useDoc, useUser } from '@/firebase';
import { collection, query, where, limit, getDocs, doc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import MainLayout from '@/components/layout/main-layout';
import { BrandSkeleton } from '@/components/ui/brand-skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Briefcase, Wrench, Heart, Users, ShoppingBag, Gift, Server, ChevronLeft } from 'lucide-react';
import BenefitsGrid from '@/components/benefits/benefits-grid';
import { makeBenefitSerializable } from '@/lib/data';
import type { Benefit, SerializableBenefit, Service, Availability, CluberCategory, SupplierProfile } from '@/types/data';
import ServiceList from '@/components/supplier/service-list';
import { createConverter } from '@/lib/firestore-converter';
import { getInitials } from '@/lib/utils';
import SubscribeButton from '@/components/supplier/subscribe-button';
import { FavoriteButton } from '@/components/layout/favorite-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ReviewList } from '@/components/reviews/review-list';
import { ProductGrid } from '@/components/delivery/product-grid';
import { StarRating } from '@/components/reviews/star-rating';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const PendingReviewTrigger = dynamic(() => import('@/components/reviews/pending-reviews').then(m => m.PendingReviews), { ssr: false });

const LeafletMap = dynamic(() => import('@/components/maps/leaflet-map'), { 
    ssr: false,
    loading: () => <BrandSkeleton className="h-[300px] w-full rounded-[2rem]" />
});

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
        <div className="min-h-screen">
            <div className="flex flex-col items-center pt-20 pb-12 bg-transparent">
                <BrandSkeleton className="w-32 h-32 rounded-[2.5rem] mb-6" />
                <BrandSkeleton className="h-10 w-64 mb-4 rounded-xl" />
                <BrandSkeleton className="h-4 w-40 rounded-full" />
            </div>
            <div className="px-6 py-8 max-w-5xl mx-auto">
                <BrandSkeleton className="h-10 w-full rounded-2xl mb-8 max-w-lg mx-auto" />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <BrandSkeleton key={i} className="h-64 w-full rounded-[2rem]" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function AverageRating({ supplier }: { supplier: SupplierProfile }) {
    const avg = supplier.avgRating || 0;
    const count = supplier.reviewCount || 0;
    
    if (count === 0) return null;
    
    return (
        <div className="flex items-center gap-1.5 mt-1 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 px-2.5 py-0.5 rounded-full border border-yellow-400/20 shadow-sm animate-in fade-in duration-500">
            <StarRating rating={avg} readonly size="sm" />
            <span className="text-xs font-black">{avg.toFixed(1)}</span>
            <span className="text-[10px] text-foreground font-bold">({count})</span>
        </div>
    );
}

function CluberProfileContent() {
    const searchParams = useSearchParams();
    const slug = searchParams.get('slug');
    
    const firestore = useFirestore();
    const { user } = useUser();
    const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
    const [isLoadingSupplier, setIsLoadingSupplier] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSupplier = async () => {
            if (!slug || !firestore) {
                if (!slug) {
                   setIsLoadingSupplier(false);
                   setError('SLUG no proporcionado');
                }
                return;
            }
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
    
    if (error || !slug) {
         return (
            <div className="flex items-center justify-center pt-16">
                 <Alert variant="destructive" className="max-w-lg">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || 'Falta parámetro slug'}</AlertDescription>
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

    const tabParam = searchParams.get('tab');
    const hasBenefits = benefits && benefits.length > 0;
    const hasServices = supplier.appointmentsEnabled && services && services.length > 0;
    
    const defaultTab = tabParam || (supplier.deliveryEnabled ? "catalog" : hasBenefits ? "benefits" : hasServices ? "services" : "benefits");

    return (
        <div className="flex flex-col min-h-screen">
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center text-center pt-20 pb-12 bg-transparent relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                
                <BackButton />

                <motion.div 
                    whileHover={{ scale: 1.05, rotate: -2 }}
                    className="relative w-32 h-32 rounded-[2.5rem] bg-card glass glass-dark shadow-premium overflow-hidden mb-6 group transition-all duration-500 hover:shadow-2xl"
                >
                    <Avatar className="h-full w-full rounded-none">
                        <AvatarImage
                            src={supplier.logoUrl || undefined}
                            alt={supplier.name}
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <AvatarFallback className="rounded-none bg-transparent text-4xl font-black text-foreground">
                            {supplierInitials}
                        </AvatarFallback>
                    </Avatar>
                </motion.div>
                
                <div className="relative z-10 px-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground mb-2 uppercase leading-[0.9]">
                        {supplier.name}
                    </h1>
                    <div className="flex flex-col items-center gap-2 mt-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">
                            <TypeIcon className="h-4 w-4" />
                            <p>{supplier.type}</p>
                        </div>
                        <AverageRating supplier={supplier} />
                    </div>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        {!isOwnProfile && (
                            <SubscribeButton supplierId={supplier.id} />
                        )}
                        {!isOwnProfile && (
                            <FavoriteButton id={supplier.id} type="supplier" />
                        )}
                    </div>
                </div>
            </motion.header>
            
            <main className="w-full max-w-5xl mx-auto px-4 py-12">
                {supplier.description && (
                     <p className="text-foreground max-w-2xl mx-auto text-center mb-12 text-lg font-medium leading-relaxed">
                        "{supplier.description}"
                     </p>
                )}

                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mx-auto max-w-xl mb-12 h-14 p-1.5 glass glass-dark shadow-premium rounded-2xl">
                        <TabsTrigger value="benefits" className="font-extrabold rounded-xl data-[state=active]:shadow-lg">Beneficios</TabsTrigger>
                        <TabsTrigger value="catalog" className="font-extrabold rounded-xl data-[state=active]:shadow-lg" disabled={!supplier.deliveryEnabled}>Catálogo</TabsTrigger>
                        <TabsTrigger value="services" className="font-extrabold rounded-xl data-[state=active]:shadow-lg" disabled={!hasServices}>Turnos</TabsTrigger>
                        <TabsTrigger value="reviews" className="font-extrabold rounded-xl data-[state=active]:shadow-lg">Reseñas</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="catalog" className="animate-in fade-in-50 duration-500">
                        {supplier.deliveryEnabled ? (
                            <ProductGrid 
                                supplierId={supplier.id} 
                                supplierName={supplier.name} 
                                supplierPhone={supplier.whatsapp || ''} 
                            />
                        ) : (
                            <EmptyState icon={ShoppingBag} title="Sin Catálogo" description="Este Cluber no tiene productos disponibles para delivery por el momento."/>
                        )}
                    </TabsContent>

                    <TabsContent value="benefits" className="animate-in fade-in-50 duration-500">
                         {benefitsLoading ? <BrandSkeleton className="h-64 w-full rounded-[2rem]" /> : (
                            hasBenefits ? <BenefitsGrid benefits={serializableBenefits} /> : <EmptyState icon={Gift} title="Sin Beneficios" description="Este Cluber no tiene beneficios activos en este momento."/>
                         )}
                    </TabsContent>

                    <TabsContent value="services" className="animate-in fade-in-50 duration-500">
                        {hasServices ? (
                            <ServiceList 
                                services={services || []} 
                                availability={availability} 
                                supplierId={supplier.id} 
                                allowsBooking={!!supplier.appointmentsEnabled}
                            />
                        ) : (
                            <EmptyState icon={Server} title="Sin Turnos" description="Este Cluber no ofrece turnos online por el momento."/>
                        )}
                    </TabsContent>

                    <TabsContent value="reviews" className="animate-in fade-in-50 duration-500 max-w-2xl mx-auto space-y-8">
                        <PendingReviewTrigger supplierId={supplier.id} />
                        <ReviewList supplierId={supplier.id} />
                    </TabsContent>
                </Tabs>

                {supplier.location && supplier.location.lat && supplier.location.lng && (
                    <motion.section 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-20 space-y-6"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter">Ubicación</h2>
                                <p className="text-xs font-bold text-foreground">{supplier.location.address}</p>
                            </div>
                        </div>
                        <LeafletMap 
                            center={[supplier.location.lat, supplier.location.lng]} 
                            zoom={15} 
                            markers={[{
                                id: supplier.id,
                                position: [supplier.location.lat, supplier.location.lng],
                                title: supplier.name
                            }]}
                            className="h-[300px] w-full"
                        />
                    </motion.section>
                )}
            </main>
        </div>
    );
}

export default function CluberProfilePage() {
    return (
        <MainLayout>
            <CluberProfileContent />
        </MainLayout>
    );
}


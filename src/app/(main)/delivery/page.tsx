'use client';

import MainLayout from '@/components/layout/main-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { SupplierProfile } from '@/types/data';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { Suspense, useState, useMemo } from 'react';
import { ArrowDownUp, Grid, ShoppingBag, MapPin, Search, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter } from 'next/navigation';
import { createConverter } from '@/lib/firestore-converter';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn, isStoreOpen } from '@/lib/utils';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';

type SortOption = 'name_asc' | 'proximity';

function DeliveryListSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-3xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function DeliveryList() {
    const firestore = useFirestore();
    const router = useRouter();
    const [sortOption, setSortOption] = useState<SortOption>('name_asc');
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get('category');
    const { userLocation } = useUser();

    const suppliersQuery = useMemo(() => {
        if (!firestore) return null;
        
        let q = query(
            collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()),
            where('deliveryEnabled', '==', true),
            limit(100)
        );

        if (categoryFilter) {
            q = query(q, where('deliveryCategory', '==', categoryFilter));
        }

        return q;
    }, [firestore, categoryFilter]);

    const { data: suppliers, isLoading, error } = useCollection(suppliersQuery);

    const sortedSuppliers = useMemo(() => {
        if (!suppliers) return [];
        // Filter out closed stores
        const openSuppliers = suppliers.filter(isStoreOpen);
        return [...openSuppliers].sort((a, b) => a.name.localeCompare(b.name));
    }, [suppliers]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 glass glass-dark rounded-[2.5rem] shadow-premium border border-white/5">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground/50">Ordenar por</h3>
                        <p className="text-xs font-bold text-primary">{categoryFilter ? `Categoría: ${categoryFilter}` : 'Todos los locales'}</p>
                    </div>
                 </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Select onValueChange={(value: SortOption) => setSortOption(value)} defaultValue={sortOption}>
                        <SelectTrigger className="flex-1 md:w-[220px] bg-background/50 border-primary/10 h-12 rounded-2xl font-bold">
                            <SelectValue placeholder="Ordenar por..." />
                        </SelectTrigger>
                        <SelectContent className="glass glass-dark border-primary/10 rounded-2xl">
                            <SelectItem value="name_asc" className="font-bold">Nombre (A-Z)</SelectItem>
                            <SelectItem value="proximity" className="font-bold" disabled={!userLocation}>Cercanía</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="min-h-[600px]">
                {isLoading && <DeliveryListSkeleton />}

                {error && (
                    <div className="text-center py-20 space-y-4">
                        <p className="text-destructive font-bold text-xl">Error al cargar el menú</p>
                        <p className="text-foreground">{error.message}</p>
                    </div>
                )}

                {!isLoading && !error && (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        {sortedSuppliers.map((supplier) => (
                            <Link href={`/proveedores/${supplier.slug}`} key={supplier.id}>
                                <Card className="group relative overflow-hidden rounded-[2.5rem] border-foreground/50 bg-card hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full border-white/10">
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 z-10" />
                                    
                                    <div className="aspect-[16/10] overflow-hidden relative">
                                        {(supplier.coverUrl || supplier.logoUrl) ? (
                                            <img 
                                                src={supplier.coverUrl || supplier.logoUrl} 
                                                alt={supplier.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-background flex items-center justify-center">
                                                <ShoppingBag className="h-12 w-12 text-foreground/20" />
                                            </div>
                                        )}
                                        
                                        <Badge className="absolute top-4 right-4 z-20 bg-primary/90 backdrop-blur-md text-white border-0 shadow-lg px-3 py-1 font-black text-[10px] uppercase tracking-widest rounded-full">
                                            {supplier.deliveryCategory || 'Comida'}
                                        </Badge>
                                    </div>

                                    <CardHeader className="relative z-20 space-y-2 p-6">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-xl font-black tracking-tighter group-hover:text-primary transition-colors duration-300">
                                                {supplier.name}
                                            </CardTitle>
                                        </div>
                                        <CardDescription className="line-clamp-2 text-sm font-medium leading-relaxed italic">
                                            {supplier.description || 'Sin descripción disponible.'}
                                        </CardDescription>
                                        
                                        <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                                                <MapPin className="h-3 w-3" />
                                                <span className="truncate max-w-[120px]">{supplier.address || 'Ubicación'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-green-500">
                                                <TruckIcon className="h-3 w-3" />
                                                <span>
                                                    {supplier.deliveryCostType === 'to_be_agreed' 
                                                        ? 'Envío a convenir' 
                                                        : supplier.deliveryCostType === 'free' || supplier.deliveryCost === 0 
                                                            ? 'Envío Gratis' 
                                                            : `Envío: $${supplier.deliveryCost}`}
                                                </span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {!isLoading && sortedSuppliers.length === 0 && (
                    <div className="text-center py-32 space-y-4 opacity-50">
                        <ShoppingBag className="h-16 w-16 mx-auto text-foreground" />
                        <h3 className="text-2xl font-black uppercase tracking-widest">No hay delivery disponible</h3>
                        <p className="text-foreground font-medium">Prueba con otra categoría o vuelve más tarde.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const TruckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
);

import dynamic from 'next/dynamic';
const WelcomeMessage = dynamic(() => import('@/components/home/welcome-message'), { ssr: false });
const PendingReviews = dynamic(() => import('@/components/reviews/pending-reviews').then(m => m.PendingReviews), { ssr: false });

import { ChevronLeft } from 'lucide-react';
import { StoreMap } from '@/components/delivery/store-map';

function DeliveryPageContent() {
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get('category');
    const router = useRouter();
    const firestore = useFirestore();

    const suppliersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>()),
            where('deliveryEnabled', '==', true),
            limit(20)
        );
    }, [firestore]);

    const { data: suppliers } = useCollection(suppliersQuery);

    return (
        <MainLayout>
            <div className="mx-auto w-full px-4 pt-4">
                <div className="flex items-center justify-between mb-4">
                    <ModeToggle />
                    {categoryFilter && (
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={() => router.push('/delivery')}
                            className="font-black text-[10px] uppercase tracking-[0.2em] text-primary gap-2 h-10 px-6 rounded-2xl animate-in slide-in-from-right-4 duration-500 shadow-premium"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Volver al Inicio
                        </Button>
                    )}
                </div>

                {categoryFilter ? (
                  <div className="mb-10 space-y-2 animate-in fade-in slide-in-from-left-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic px-1">
                      {categoryFilter}
                    </h1>
                    <p className="text-sm font-bold text-foreground uppercase tracking-widest px-1 opacity-60">
                      Explorando locales en esta categoría
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <WelcomeMessage />
                    {!categoryFilter && suppliers && suppliers.length > 0 && (
                        <div className="animate-in fade-in duration-1000 delay-300">
                             <StoreMap suppliers={suppliers as SupplierProfile[]} />
                        </div>
                    )}
                  </div>
                )}
                
                <Suspense fallback={<div className="space-y-8"><Skeleton className="h-48 w-full rounded-3xl" /></div>}>
                    {categoryFilter ? (
                        <div className="py-4">
                            <DeliveryList />
                        </div>
                    ) : (
                        <DeliveryHomeSections />
                    )}
                </Suspense>
            </div>
        </MainLayout>
    );
}

export default function DeliveryLandingPage() {
    return (
        <Suspense fallback={<DeliveryListSkeleton />}>
            <DeliveryPageContent />
        </Suspense>
    );
}

import HomeSectionRenderer from '@/components/home/home-section-renderer';
import { HomeSection } from '@/types/data';

function DeliveryHomeSections() {
    const firestore = useFirestore();
    const sectionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>()),
            orderBy('order', 'asc')
        );
    }, [firestore]);

    const { data: allSections, isLoading } = useCollection(sectionsQuery);

    const sections = useMemo(() => {
        if (!allSections) return [];
        return allSections.filter(s => s.isActive && s.targetBoard === 'delivery');
    }, [allSections]);

    if (isLoading) return null;

    if (!sections || sections.length === 0) {
        return (
            <div className="text-center py-20 bg-background/50 border-2 border-dashed border-white/10 rounded-[3rem]">
                <p className="text-foreground italic">No hay secciones configuradas para Delivery. Configúralas en el Home Builder.</p>
            </div>
        );
    }

    return (
        <div className="">
            {sections.map((section) => (
                <section key={section.id} className={cn(section.title ? "space-y-4 mb-12" : "mb-4")}>
                    {section.title && (
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg font-extrabold tracking-tight text-foreground uppercase text-[12px] sm:text-sm text-foreground/80 tracking-[0.2em]">
                                {section.title}
                            </h2>
                            {'contentType' in section.block && section.block.contentType && section.block.contentType !== 'banners' && (
                                <Button variant="ghost" asChild className="h-auto p-0 text-sm font-bold text-primary hover:bg-transparent hover:text-primary/70 transition-colors">
                                    <Link href={
                                        ['suppliers', 'minisuppliers', 'supplierpromo', 'suppliers_nearby'].includes(section.block.contentType as string)
                                            ? '/proveedores' 
                                            : ['delivery_suppliers', 'delivery_products', 'delivery_promos', 'productexmplsupplier'].includes(section.block.contentType as string)
                                                ? '/delivery'
                                                : ['benefits_nearby', 'perks'].includes(section.block.contentType as string)
                                                    ? '/benefits'
                                                    : `/${section.block.contentType}`
                                    }>
                                        VER TODOS <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    )}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <HomeSectionRenderer section={section} />
                    </div>
                </section>
            ))}
        </div>
    );
}


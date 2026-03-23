'use client';

import MainLayout from '@/components/layout/main-layout';
import BenefitsGrid from '@/components/perks/perks-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useCincoDosStatus } from '@/firebase/auth/use-cinco-dos';
import type { Benefit, SerializableBenefit } from '@/types/data';
import { makeBenefitSerializable } from '@/lib/data';
import { collection, query, where, Timestamp, limit } from 'firebase/firestore';
import { Suspense, useState, useMemo } from 'react';
import { ArrowDownUp, Map as MapIcon, Grid, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { createConverter } from '@/lib/firestore-converter';
import DiscoveryMap from '@/components/maps/discovery-map';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { calculateDistance } from '@/lib/geo-utils';
import type { SupplierProfile } from '@/types/data';
import { Switch } from '@/components/ui/switch';
import LocationPicker from '@/components/maps/location-picker';
import { cn } from '@/lib/utils';

type SortOption = 'createdAt_desc' | 'createdAt_asc' | 'proximity';

function BenefitsGridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function BenefitsList() {
    const firestore = useFirestore();
    const { isUserLoading } = useUser();
    const [sortOption, setSortOption] = useState<SortOption>('createdAt_desc');
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get('category');
    const { userLocation } = useUser();

    const benefitsQuery = useMemo(() => {
        if (!firestore) return null;
        
        let q = query(collection(firestore, 'benefits').withConverter(createConverter<Benefit>()), limit(100));

        if (categoryFilter) {
            q = query(q, where('category', '==', categoryFilter));
        }

        return q;
    }, [firestore, categoryFilter]);

    const { data: benefits, isLoading, error } = useCollection(benefitsQuery);
    const { isApproved: isCincoDos } = useCincoDosStatus();

    const sortedBenefits = useMemo(() => {
        if (!benefits) return [];
        
        const sorted = [...benefits].sort((a, b) => {
            if (sortOption === 'proximity' && userLocation) {
                // This would require supplier locations which we don't have here easily
                // For the grid, we'll keep it simple or fetch suppliers
                return 0; 
            }
            
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
            
            if (sortOption === 'createdAt_asc') return dateA - dateB;
            return dateB - dateA; // Default
        });

        return sorted;
    }, [benefits, sortOption, userLocation]);

    // Better sorting logic that includes distance mapping
    const { data: suppliers } = useCollection(query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())));

    const processedBenefits = useMemo(() => {
        if (!benefits || !suppliers) return [];
        const supplierMap = new Map(suppliers.map(s => [s.id, s]));

        let result = benefits
          .filter(b => {
             // Filter out 'cinco_dos' benefits if the user does not have access
             if (b.targetAudience === 'cinco_dos' && !isCincoDos) return false;
             return true;
          })
          .map(b => {
              const supplier = supplierMap.get(b.ownerId);
              const distance = (userLocation && supplier?.location)
                ? calculateDistance(userLocation.lat, userLocation.lng, supplier.location.lat, supplier.location.lng)
                : Infinity;
            
            return {
                ...makeBenefitSerializable(b),
                supplierName: supplier?.name,
                supplierLocation: supplier?.location,
                distance
            };
        });

        if (sortOption === 'proximity') {
            result.sort((a, b) => a.distance - b.distance);
        } else {
            result.sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return sortOption === 'createdAt_asc' ? dateA - dateB : dateB - dateA;
            });
        }

        return result;
    }, [benefits, suppliers, sortOption, userLocation, isCincoDos]);

    const combinedIsLoading = isUserLoading || isLoading;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4 p-4 glass glass-dark rounded-3xl shadow-premium">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <ArrowDownUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">Ordenar por</h3>
                        {categoryFilter && <p className="text-xs font-bold text-primary">Categoría: {categoryFilter}</p>}
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2 bg-background/40 p-1 rounded-2xl border border-white/5">
                    <Button 
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => { haptic.vibrateSubtle(); setViewMode('grid'); }}
                        className={cn("rounded-xl h-9 px-4 font-bold transition-all", viewMode === 'grid' && "shadow-lg")}
                    >
                        <Grid className="h-4 w-4 mr-2" />
                        Lista
                    </Button>
                    <Button 
                        variant={viewMode === 'map' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => { haptic.vibrateSubtle(); setViewMode('map'); }}
                        className={cn("rounded-xl h-9 px-4 font-bold transition-all", viewMode === 'map' && "shadow-lg")}
                    >
                        <MapIcon className="h-4 w-4 mr-2" />
                        Mapa
                    </Button>
                 </div>

                <Select onValueChange={(value: SortOption) => setSortOption(value)} defaultValue={sortOption}>
                    <SelectTrigger className="w-full md:w-[220px] bg-background/50 border-primary/10 h-11 rounded-xl font-bold">
                        <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent className="glass glass-dark border-primary/10 rounded-xl">
                        <SelectItem value="createdAt_desc" className="font-bold">Más Nuevos</SelectItem>
                        <SelectItem value="createdAt_asc" className="font-bold">Más Antiguos</SelectItem>
                        <SelectItem value="proximity" className="font-bold" disabled={!userLocation}>Cercanía</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="min-h-[600px]">
                {viewMode === 'map' ? (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <div className="flex items-center gap-2 p-2">
                            <MapPin className="h-5 w-5 text-primary animate-pulse" />
                            <h2 className="text-xl font-black uppercase tracking-tighter">Locales cercanos</h2>
                        </div>
                        <DiscoveryMap />
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {combinedIsLoading && <BenefitsGridSkeleton />}

                        {error && (
                            <p className="text-destructive text-center font-bold">
                                Error al cargar los beneficios: {error.message}
                            </p>
                        )}

                        {!combinedIsLoading && !error && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <BenefitsGrid benefits={processedBenefits as any[]} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BenefitsPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-12 p-4 md:p-12 max-w-7xl mx-auto">
                <header className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                        Todos los <span className="text-primary">Beneficios</span>
                    </h1>
                    <p className="text-lg text-muted-foreground font-medium max-w-2xl leading-relaxed">
                        Explora todos los descuentos, ofertas y eventos exclusivos disponibles para la comunidad de EstuClub.
                    </p>
                </header>

                <Suspense fallback={<BenefitsGridSkeleton />}>
                    <BenefitsList />
                </Suspense>
            </div>
        </MainLayout>
    );
}

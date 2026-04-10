
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useDocOnce, useCollectionOnce } from '@/firebase';
import { collection, query, where, orderBy, doc, limit as firestoreLimit, DocumentData, Query, collectionGroup } from 'firebase/firestore';
import { HomeSection, Benefit, SupplierProfile, Announcement, Banner, Category, Product, Service } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { makeBenefitSerializable } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { useCincoDosStatus } from '@/firebase/auth/use-cinco-dos';
import { useSearchParams } from 'next/navigation';
import { isStoreOpen } from '@/lib/utils';

import { BenefitsGrid, SuppliersGrid, AnnouncementsGrid, ProductsGrid } from '@/components/home/grids';
import { CategoryGrid } from '@/components/home/category-grid';
import { SingleAnnouncement } from '@/components/home/single-banner';
import { BenefitsCarousel, SuppliersCarousel, MiniSuppliersCarousel, AnnouncementsCarousel, ProductsCarousel, ProductsWithSupplierCarousel, SupplierPromoCarousel, ServicesCarousel, BannersCarousel } from '@/components/home/carousels';
import { NearbyBenefitsCarousel, NearbySuppliersCarousel } from '@/components/home/nearby-carousels';
import { OptimizedImage } from '@/components/common/OptimizedImage';

const SectionSkeleton = () => <Skeleton className="h-48 w-full" />;

function useDocumentsByIds<T extends { id: string }>(collectionName: string, ids: string[]) {
    const firestore = useFirestore();
    const queryForIds = useMemo(() => {
        if (!firestore || ids.length === 0) return null;
        // Handling services or products requires knowing their parent supplier paths if using manual IDs, 
        // but HomeSection manual mode usually refers to root collections. 
        // For services/products we'd need more logic, but user likely wants 'benefits' or 'suppliers' here.
        return query(
            collection(firestore, collectionName).withConverter(createConverter<T>()),
            where('__name__', 'in', ids.slice(0, 30))
        );
    }, [firestore, collectionName, JSON.stringify(ids)]);

    const { data, isLoading, error } = useCollectionOnce(queryForIds);

    const orderedData = useMemo(() => {
        if (!data) return [];
        const dataMap = new Map(data.map(item => [item.id, item]));
        return ids.map(id => dataMap.get(id)).filter((item): item is T => !!item);
    }, [data, ids]);

    return { data: orderedData, isLoading, error };
}

function HomeMessage({ title, body, imageUrl, alignment = 'left' }: { title?: string, body: string, imageUrl?: string, alignment?: 'left' | 'center' }) {
    return (
        <div className={`py-8 animate-fade-in flex flex-col md:flex-row items-center gap-8 ${alignment === 'center' ? 'text-center' : 'text-left'}`}>
            <div className="flex-1 space-y-3">
                {title && (
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground leading-tight">
                        {title}
                    </h1>
                )}
                <p className="text-foreground font-medium text-lg md:text-xl leading-relaxed italic opacity-80 max-w-2xl">
                    {body}
                </p>
            </div>
            {imageUrl && (
                <div className="relative w-full md:w-1/3 aspect-video md:aspect-square rounded-[2rem] overflow-hidden glass shadow-premium border border-white/10 group">
                    <OptimizedImage 
                        src={imageUrl} 
                        alt="Message Image" 
                        fill
                        className="transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                </div>
            )}
        </div>
    );
}

function SectionContent({ section }: { section: HomeSection }) {
    const { block } = section;
    const firestore = useFirestore();
    const { isApproved: isCincoDos } = useCincoDosStatus();
    const searchParams = useSearchParams();
    const currentCategory = searchParams.get('category');

    if (block.kind === 'message') {
        const { title, body, imageUrl, alignment } = block.message;
        return <HomeMessage title={title} body={body} imageUrl={imageUrl} alignment={alignment} />;
    }

    if (block.kind === 'categories') {
        const categoriesQuery = useMemo(() => {
            if (!firestore) return null;
            return query(
                collection(firestore, 'categories').withConverter(createConverter<Category>()),
                where('type', '==', section.targetBoard || 'benefits')
            );
        }, [firestore, section.targetBoard]);
        const { data: categories, isLoading } = useCollectionOnce(categoriesQuery);

        const orderedCategories = useMemo(() => {
            if (!categories) return [];
            return [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }, [categories]);

        if (isLoading) return <SectionSkeleton />;
        return <CategoryGrid categories={orderedCategories} />;
    }

    if (block.kind === 'banner') {
        const bannerRef = useMemo(() => {
            if (!firestore || !block.bannerId) return null;
            return doc(firestore, 'banners', block.bannerId).withConverter(createConverter<Banner>());
        }, [firestore, block.bannerId]);
        
        const { data: banner, isLoading, error } = useDocOnce(bannerRef);

        if (isLoading) return <SectionSkeleton />;
        if (!block.bannerId) return null; // Gracefully handle unconfigured banners

        if (error || !banner) {
             return (
                 <div className="py-4 px-1 animate-pulse">
                     <p className="text-foreground italic text-[10px] opacity-30 uppercase tracking-widest">
                         [Banner no disponible]
                     </p>
                 </div>
             );
        }
        return <SingleAnnouncement banner={banner as any} />;
    }

    if (!('contentType' in block)) return null;

    if (block.contentType === 'benefits_nearby') return <NearbyBenefitsCarousel />;
    if (block.contentType === 'suppliers_nearby') return <NearbySuppliersCarousel />;

    // Dynamic content (carousel/grid)
    const isDynamic = block.kind === 'carousel' || block.kind === 'grid';
    const contentType = isDynamic ? (block as any).contentType : null;

    const collectionName = (contentType === 'suppliers' || contentType === 'delivery_suppliers' || contentType === 'minisuppliers' || contentType === 'supplierpromo' || contentType === 'professionals') 
        ? 'roles_supplier' 
        : (contentType === 'delivery_products' || contentType === 'delivery_promos' || contentType === 'productexmplsupplier' || contentType === 'products')
            ? 'products'
            : (contentType === 'banner' || contentType === 'banners')
                ? 'banners'
                : contentType;
    
    const converter = useMemo(() => {
        if (collectionName === 'roles_supplier') return createConverter<SupplierProfile>();
        if (collectionName === 'products') return createConverter<Product>();
        if (collectionName === 'benefits') return createConverter<Benefit>();
        if (collectionName === 'announcements') return createConverter<Announcement>();
        if (collectionName === 'services') return createConverter<Service>();
        if (collectionName === 'banners') return createConverter<Banner>();
        return null;
    }, [collectionName]);

    let items, isLoading;

    if (block.mode === 'manual') {
        const { data: manualItems, isLoading: manualLoading } = useDocumentsByIds(collectionName, block.items || []);
        items = manualItems;
        isLoading = manualLoading;
    } else { // Auto mode
        const autoQuery = useMemo(() => {
            if (!firestore) return null;
            
            let q: Query<DocumentData>;
            if (collectionName === 'services' || collectionName === 'products') {
                 // Products and Services are usually subcollections, so use collectionGroup for auto mode across all suppliers
                 q = query(collectionGroup(firestore, collectionName));
            } else {
                 q = query(collection(firestore, collectionName));
            }
            
            if (converter) {
                q = q.withConverter(converter as any);
            }

            block.query?.filters?.forEach(f => {
                let field = f.field;
                // Translate visibility field for products if needed
                if (field === 'isVisible' && (block.contentType === 'delivery_products' || block.contentType === 'delivery_promos')) {
                    field = 'isActive';
                }
                
                if (field && f.op && f.value !== undefined) {
                    q = query(q, where(field, f.op, f.value));
                }
            });

            // Extra filter for professionals
            if (block.contentType === 'professionals') {
                if (!block.query?.filters?.some(f => f.field === 'appointmentsEnabled')) {
                    q = query(q, where('appointmentsEnabled', '==', true));
                }
            }

            // Extra filter for delivery_suppliers
            if (block.contentType === 'delivery_suppliers') {
                if (!block.query?.filters?.some(f => f.field === 'deliveryEnabled')) {
                    q = query(q, where('deliveryEnabled', '==', true));
                }
                if (currentCategory) {
                    q = query(q, where('deliveryCategory', '==', currentCategory));
                }
            }

            // Extra filters for delivery_products/promos/productexmplsupplier
            if (block.contentType === 'delivery_products' || block.contentType === 'delivery_promos' || block.contentType === 'productexmplsupplier') {
                if (!block.query?.filters?.some(f => f.field === 'stockAvailable')) {
                    q = query(q, where('stockAvailable', '==', true));
                }
                if (currentCategory) {
                    q = query(q, where('category', '==', currentCategory));
                }
            }
            if (block.query?.sort?.field) {
                q = query(q, orderBy(block.query.sort.field, block.query.sort.direction || 'desc'));
            } else if (contentType && ['benefits', 'announcements', 'services', 'products', 'banners', 'banner'].includes(contentType)) {
                // Only order by createdAt if we are NOT in banners mode or if we know banners have it
                // For now, let's make it optional or only for specific types we are sure of
                if (contentType !== 'banner' && contentType !== 'banners') {
                    q = query(q, orderBy('createdAt', 'desc'));
                }
            }

            if (block.query?.limit) {
                q = query(q, firestoreLimit(block.query.limit));
            }
            return q;
        }, [firestore, block, collectionName, currentCategory, converter]);

        const { data: autoItems, isLoading: autoLoading } = useCollection(autoQuery);
        items = autoItems;
        isLoading = autoLoading;
    }

    if (isLoading) return <SectionSkeleton />;
    
    // IF NO ITEMS, SHOW A MESSAGE INSTEAD OF HIDING (HELPS DEBUGGING)
    if (!items || items.length === 0) {
        const itemType = block.contentType.includes('product') 
            ? 'productos' 
            : block.contentType === 'services' 
                ? 'servicios' 
                : (block.contentType === 'banner' || block.contentType === 'banners') 
                    ? 'banners' 
                    : 'locales';

        return (
            <div className="py-8 px-1">
                <p className="text-foreground italic text-sm opacity-50">
                    No se encontraron {itemType} en esta sección.
                </p>
            </div>
        );
    }

    const activeTab = section.targetBoard === 'delivery' ? 'catalog' : section.targetBoard === 'turns' ? 'services' : 'benefits';

    let Component;
    const props: any = { items: [], activeTab };

    if (block.kind === 'carousel') {
        if (block.contentType === 'benefits') {
             // FILTER OUT SERVICES AND RESTRICTED AUDIENCES
             const safeItems = (items as Benefit[]).filter(b => {
                 const isService = !!b.isService;
                 const restrictedCincoDos = !!b.isCincoDosOnly && !isCincoDos;
                 // If role-based student check is needed, it would be here, but current logic prioritizes visibility for all unless explicitly blocked
                 return !isService && !restrictedCincoDos;
             });
             props.items = safeItems.map(makeBenefitSerializable);
             Component = BenefitsCarousel;
        } else if (block.contentType === 'services') {
             props.items = items;
             Component = ServicesCarousel;
        } else {
             // Filter closed stores if applicable
             const isDeliverySupplierType = ['delivery_suppliers', 'minisuppliers', 'supplierpromo'].includes(block.contentType);
             props.items = isDeliverySupplierType 
                ? (items as SupplierProfile[]).filter(isStoreOpen)
                : items;
                
             if (block.contentType === 'suppliers' || block.contentType === 'delivery_suppliers' || block.contentType === 'professionals') Component = SuppliersCarousel;
             if (block.contentType === 'minisuppliers') Component = MiniSuppliersCarousel;
             if (block.contentType === 'announcements') Component = AnnouncementsCarousel;
             if (block.contentType === 'banner' || block.contentType === 'banners') Component = BannersCarousel;
             if (block.contentType === 'delivery_products' || block.contentType === 'delivery_promos' || block.contentType === 'products') Component = ProductsCarousel;
             if (block.contentType === 'productexmplsupplier') Component = ProductsWithSupplierCarousel;
             if (block.contentType === 'supplierpromo') Component = SupplierPromoCarousel;
        }
    } else if (block.kind === 'grid') {
        if (block.contentType === 'benefits') {
            Component = BenefitsGrid;
            // FILTER OUT SERVICES AND RESTRICTED AUDIENCES
            const safeItems = (items as Benefit[]).filter(b => {
                const isService = !!b.isService;
                const restrictedCincoDos = !!b.isCincoDosOnly && !isCincoDos;
                return !isService && !restrictedCincoDos;
            });
            props.items = safeItems.map(makeBenefitSerializable);
        } else {
            Component = (block.contentType === 'suppliers' || block.contentType === 'delivery_suppliers') 
                ? SuppliersGrid 
                : (block.contentType === 'delivery_products' || block.contentType === 'delivery_promos')
                    ? ProductsGrid
                    : AnnouncementsGrid;
            
            // Filter closed stores for grid too
            const isDeliverySupplierType = ['delivery_suppliers', 'minisuppliers', 'supplierpromo'].includes(block.contentType);
            props.items = isDeliverySupplierType 
               ? (items as SupplierProfile[]).filter(isStoreOpen)
               : items;
        }
    }

    if (!Component) return null;

    return <Component {...props} />;
}

export default function HomeSectionRenderer({ section }: { section: HomeSection }) {
    return <SectionContent section={section} />;
}


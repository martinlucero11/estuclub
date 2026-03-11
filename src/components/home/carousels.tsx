'use client';
import { useMemo } from "react";
import { useCollectionOnce, useFirestore } from "@/firebase";
import {
  collection,
  query,
  limit,
  where,
  orderBy,
  QueryConstraint,
  documentId,
} from "firebase/firestore";
import Link from "next/link";
import type { Benefit, SupplierProfile, Announcement, HomeSection, Banner } from "@/types/data";
import Image from "next/image";
import { createConverter } from "@/lib/firestore-converter";
import { getInitials, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { makeBenefitSerializable } from "@/lib/data";
import BenefitCard from "../perks/perk-card";
import { Skeleton } from "../ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';


type CarouselProps = HomeSection['block'];

const buildConstraints = (
  props: CarouselProps
): QueryConstraint[] => {
  if (props.kind === 'banner' || props.kind === 'categories') {
    return [];
  }
  const { contentType, query: queryConfig } = props;
  const constraints: QueryConstraint[] = [];

  // Default filters
  if (contentType === 'benefits') {
    constraints.push(where('isVisible', '==', true));
  } else if (contentType === 'announcements') {
      constraints.push(where('status', '==', 'approved'));
  }

  // Apply custom filters from Home Builder
  queryConfig?.filters?.forEach((f) => {
    if (f.field && f.op && f.value !== undefined) {
      constraints.push(where(f.field, f.op, f.value));
    }
  });

  // Apply sorting
  if (queryConfig?.sort?.field) {
    constraints.push(orderBy(queryConfig.sort.field, queryConfig.sort.direction || 'desc'));
  } else if (contentType !== 'suppliers') {
      // Default sort for benefits and announcements if not specified
      constraints.push(orderBy('createdAt', 'desc'));
  }
  
  // Apply limit
  constraints.push(limit(queryConfig?.limit || 10));

  return constraints;
};

// --- SUPPLIER CARD ---
const SupplierCard = ({ supplier }: { supplier: SupplierProfile }) => {
    const initials = getInitials(supplier.name);
    return (
        <Link href={`/proveedores/${supplier.slug}`} className="block w-24 snap-start text-center group">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-card hover:bg-accent transition-colors flex items-center justify-center">
                 <Avatar className="h-16 w-16">
                    <AvatarImage src={supplier.logoUrl} alt={supplier.name} className="object-cover group-hover:scale-110 transition-transform" />
                    <AvatarFallback className="text-xl font-bold bg-transparent">{initials}</AvatarFallback>
                </Avatar>
            </div>
            <p className="text-sm font-semibold text-center mt-2 line-clamp-1 group-hover:text-primary">{supplier.name}</p>
        </Link>
    );
};


// --- ANNOUNCEMENT CARD ---
const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => (
    <Link href={announcement.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block w-80 snap-start group">
        <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-sm">
            <Image 
                src={announcement.imageUrl || 'https://picsum.photos/seed/announcement/320/192'}
                alt={announcement.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="80vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
            <div className="absolute bottom-0 left-0 p-4">
                <h3 className="text-white font-bold text-lg drop-shadow-md line-clamp-2">{announcement.title}</h3>
            </div>
        </div>
    </Link>
);

// --- BANNER CAROUSEL CARD ---
const BannerCarouselCard = ({ banner }: { banner: Banner }) => {
    const bannerImage = (
        <Image
            src={banner.imageUrl}
            alt={banner.title || 'Banner promocional'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 50vw"
        />
    );

    const containerClasses = "relative w-full overflow-hidden rounded-2xl aspect-video";

    if (banner.link) {
        return (
            <Link href={banner.link} target="_blank" rel="noopener noreferrer" className={cn(containerClasses)}>
                {bannerImage}
            </Link>
        )
    }

    return (
        <div className={cn(containerClasses)}>
            {bannerImage}
        </div>
    );
};


// --- UNIFIED CAROUSEL FACTORY ---
const createDynamicCarousel = <T extends {id: string, name?: string, title?: string}>(
    CardComponent: React.FC<any>, 
    collectionName: string, 
    dataKey: string,
    contentType: "benefits" | "suppliers" | "announcements"
) => {
    return function Carousel(props: CarouselProps) {
        const firestore = useFirestore();
        const { kind, mode, items: itemIds, query: queryConfig } = props;

        // Use stringified versions for stable dependencies in useMemo
        const stringifiedItemIds = JSON.stringify(itemIds);
        const stringifiedQueryConfig = JSON.stringify(queryConfig);

        const itemsQuery = useMemo(() => {
            if (kind !== 'carousel' || !firestore) return null;

            const itemsCollection = collection(firestore, collectionName).withConverter(createConverter<T>());
            
            if (mode === 'manual' && itemIds && itemIds.length > 0) {
                const currentItemIds = itemIds.slice(0, 30);
                if (currentItemIds.length === 0) return null;
                return query(itemsCollection, where(documentId(), 'in', currentItemIds));
            }
            
            if (mode === 'auto') {
                const stableProps = { kind, mode, query: queryConfig, contentType };
                const constraints = buildConstraints(stableProps as any);
                return query(itemsCollection, ...constraints);
            }

            return null;
        }, [firestore, kind, mode, stringifiedItemIds, stringifiedQueryConfig, contentType]);
        
        const { data: queriedItems, isLoading, error } = useCollectionOnce(itemsQuery);
        
        const items = useMemo(() => {
            if (!queriedItems) return [];
            
            if (mode === 'manual' && itemIds) {
                const orderMap = new Map(itemIds.map((id, index) => [id, index]));
                return [...queriedItems].sort((a, b) => {
                    const orderA = orderMap.get(a.id);
                    const orderB = orderMap.get(b.id);
                    if (orderA === undefined || orderB === undefined) return 0;
                    return orderA - orderB;
                });
            }
            
            if (kind === 'carousel' && contentType === 'suppliers' && queryConfig?.sort?.field === 'name') {
                 return [...queriedItems].sort((a: any, b: any) => {
                    const direction = queryConfig?.sort?.direction === 'asc' ? 1 : -1;
                    return a.name.localeCompare(b.name) * direction;
                });
            }
            
            return queriedItems;
        }, [queriedItems, mode, stringifiedItemIds, kind, contentType, queryConfig]);

        const processedItems = useMemo(() => {
            if (!items) return [];
            if (contentType === 'benefits') {
                 return items.map(b => makeBenefitSerializable(b as unknown as Benefit));
            }
            return items;
        }, [items]);

        if (isLoading) {
            const skeletonHeight = collectionName === 'benefits' ? 'h-[280px]' : 'h-[150px]';
            return (
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`w-52 ${skeletonHeight} bg-muted/50 rounded-3xl animate-pulse`}></div>
                    ))}
                </div>
            )
        }

        if (error || !processedItems || processedItems.length === 0) {
            return <p className="text-muted-foreground italic text-sm">No hay contenido para mostrar.</p>;
        }

        return (
             <div className="flex flex-nowrap overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {processedItems.map(item => <CardComponent key={item.id} {...{ [dataKey]: item }} variant="carousel" className="w-52 snap-start" />)}
            </div>
        )
    }
}

// --- DEDICATED BANNERS CAROUSEL ---
export function BannersCarousel(props: CarouselProps) {
    const firestore = useFirestore();
    
    // Explicitly destructure props needed for banner carousel
    if (props.kind !== 'carousel' || props.contentType !== 'banners') return null;
    const { mode, items: itemIds, query: queryConfig } = props;

    // Memoize query based on props
    const bannersQuery = useMemo(() => {
        if (!firestore) return null;

        const bannersCollection = collection(firestore, 'banners').withConverter(createConverter<Banner>());
        
        if (mode === 'manual') {
            if (!itemIds || itemIds.length === 0) return null;
            const currentItemIds = itemIds.slice(0, 30); // Firestore 'in' limit
            if (currentItemIds.length === 0) return null;
            return query(bannersCollection, where(documentId(), 'in', currentItemIds));
        }

        if (mode === 'auto') {
             const constraints: QueryConstraint[] = [where('isActive', '==', true)];
             if (queryConfig?.sort?.field) {
                constraints.push(orderBy(queryConfig.sort.field, queryConfig.sort.direction || 'desc'));
             } else {
                // A default sort is good practice
                constraints.push(orderBy('createdAt', 'desc'));
             }
             constraints.push(limit(queryConfig?.limit || 10));
             return query(bannersCollection, ...constraints);
        }

        return null;
    }, [firestore, mode, itemIds, queryConfig]);

    const { data: queriedItems, isLoading, error } = useCollectionOnce(bannersQuery);

    const banners = useMemo(() => {
        if (!queriedItems) return [];
        if (mode === 'manual' && itemIds) {
            // Re-order based on the selection order
            const orderMap = new Map(itemIds.map((id, index) => [id, index]));
            return [...queriedItems].sort((a, b) => {
                const orderA = orderMap.get(a.id);
                const orderB = orderMap.get(b.id);
                if (orderA === undefined || orderB === undefined) return 0;
                return orderA - orderB;
            });
        }
        return queriedItems;
    }, [queriedItems, mode, itemIds]);


    if (isLoading) {
        return (
            <div className="flex w-full gap-4 overflow-hidden">
                <Skeleton className="h-36 basis-4/5 md:basis-1/2" />
                <Skeleton className="h-36 basis-4/5 md:basis-1/2" />
            </div>
        );
    }
    
    if (error || !banners || banners.length === 0) {
        return <p className="text-muted-foreground italic text-sm">No hay banners para mostrar.</p>;
    }
    
    return (
        <Carousel opts={{ align: "start" }} className="w-full">
            <CarouselContent className="-ml-4">
                {banners.map(banner => (
                    <CarouselItem key={banner.id} className="basis-4/5 md:basis-1/2 pl-4">
                        <BannerCarouselCard banner={banner as Banner} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
        </Carousel>
    );
}

export const BenefitsCarousel = createDynamicCarousel<Benefit>(BenefitCard, 'benefits', 'benefit', 'benefits');
export const SuppliersCarousel = createDynamicCarousel<SupplierProfile>(SupplierCard, 'roles_supplier', 'supplier', 'suppliers');
export const AnnouncementsCarousel = createDynamicCarousel<Announcement>(AnnouncementCard, 'announcements', 'announcement', 'announcements');

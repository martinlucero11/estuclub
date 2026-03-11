
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
import type { Benefit, SupplierProfile, Announcement, HomeSection, Banner, SerializableBenefit } from "@/types/data";
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
import AnnouncementCard from "../announcements/announcement-card";


type CarouselProps = HomeSection['block'];

const buildConstraints = (
  props: CarouselProps
): QueryConstraint[] => {
  if (props.kind !== 'carousel') {
    return [];
  }
  const { contentType, query: queryConfig } = props;
  const constraints: QueryConstraint[] = [];

  // Default filters for auto mode
  if (contentType === 'benefits') {
    constraints.push(where('isVisible', '==', true));
  } else if (contentType === 'announcements') {
      constraints.push(where('status', '==', 'approved'));
  } else if (contentType === 'banners') {
      constraints.push(where('isActive', '==', true));
  } else if (contentType === 'suppliers') {
      constraints.push(where('isVisible', '==', true));
  }

  // Apply custom filters from Home Builder
  queryConfig?.filters?.forEach((f) => {
    if (f.field && f.op && f.value !== undefined) {
      // Defensively map 'isVisible' to 'isActive' for banners to support old sections
      if (contentType === 'banners' && f.field === 'isVisible') {
        constraints.push(where('isActive', f.op, f.value));
      } else {
        constraints.push(where(f.field, f.op, f.value));
      }
    }
  });

  // Apply sorting
  if (queryConfig?.sort?.field) {
    constraints.push(orderBy(queryConfig.sort.field, queryConfig.sort.direction || 'desc'));
  } else if (contentType !== 'banners') { // Banners might not have a reliable createdAt
      constraints.push(orderBy('createdAt', 'desc'));
  }
  
  // Apply limit
  constraints.push(limit(queryConfig?.limit || 10));

  return constraints;
};


function useCarouselData<T extends { id: string }>(
  collectionName: string,
  props: CarouselProps
) {
  const firestore = useFirestore();

  if (props.kind !== 'carousel') {
    return { items: [], isLoading: false, error: null };
  }

  const { mode = 'auto', items: itemIds = [], query: queryConfig, contentType } = props;

  // Create stable stringified versions of props that are objects/arrays
  const stringifiedItemIds = JSON.stringify(itemIds);
  const stringifiedQueryConfig = JSON.stringify(queryConfig);

  const dataQuery = useMemo(() => {
    if (!firestore) return null;

    const itemsCollection = collection(firestore, collectionName).withConverter(createConverter<T>());
    
    if (mode === 'manual') {
      const parsedItemIds = JSON.parse(stringifiedItemIds);
      if (parsedItemIds.length === 0) return null;
      // Firestore 'in' query is limited to 30 items
      return query(itemsCollection, where(documentId(), 'in', parsedItemIds.slice(0, 30)));
    }
    
    // Auto mode
    const parsedQueryConfig = JSON.parse(stringifiedQueryConfig || '{}');
    const stableProps = { kind: 'carousel', contentType, query: parsedQueryConfig };
    const constraints = buildConstraints(stableProps as any);
    return query(itemsCollection, ...constraints);

  }, [firestore, collectionName, mode, stringifiedItemIds, stringifiedQueryConfig, contentType]);

  const { data: queriedItems, isLoading, error } = useCollectionOnce(dataQuery);
  
  const items = useMemo(() => {
    if (!queriedItems) return [];
    if (mode === 'manual') {
      const parsedItemIds = JSON.parse(stringifiedItemIds || '[]');
      if (!parsedItemIds || parsedItemIds.length === 0) return [];
      const orderMap = new Map(parsedItemIds.map((id: string, index: number) => [id, index]));
      return [...queriedItems].sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity));
    }
    return queriedItems;
  }, [queriedItems, mode, stringifiedItemIds]);

  return { items, isLoading, error };
}


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

// --- BANNER CAROUSEL CARD ---
const BannerCarouselCard = ({ banner, priority = false }: { banner: Banner, priority?: boolean }) => {
    const bannerImage = (
        <Image
            src={banner.imageUrl}
            alt={banner.title || 'Banner promocional'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 50vw"
            priority={priority}
        />
    );

    const containerClasses = "relative w-full overflow-hidden rounded-2xl h-48";

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


// --- CAROUSEL COMPONENTS ---

export function BenefitsCarousel(props: CarouselProps) {
    const { items, isLoading, error } = useCarouselData<Benefit>('benefits', props);

    const serializableBenefits: SerializableBenefit[] = useMemo(() => {
        if (!items) return [];
        return items.map(b => makeBenefitSerializable(b as Benefit));
    }, [items]);

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="w-52 h-[280px] bg-muted/50 rounded-3xl" />
                ))}
            </div>
        )
    }
    if (error || serializableBenefits.length === 0) return <p className="text-muted-foreground italic text-sm">No hay beneficios para mostrar.</p>;

    return (
        <div className="flex flex-nowrap overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {serializableBenefits.map(item => <BenefitCard key={item.id} benefit={item} variant="carousel" className="w-52 snap-start" />)}
        </div>
    )
}

export function SuppliersCarousel(props: CarouselProps) {
    const { items: suppliers, isLoading, error } = useCarouselData<SupplierProfile>('roles_supplier', props);

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="w-24 h-[124px] bg-muted/50 rounded-3xl" />
                ))}
            </div>
        )
    }
    if (error || suppliers.length === 0) return <p className="text-muted-foreground italic text-sm">No hay proveedores para mostrar.</p>;

    return (
        <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {suppliers.map(item => <SupplierCard key={item.id} supplier={item as SupplierProfile} />)}
        </div>
    )
}

export function AnnouncementsCarousel(props: CarouselProps) {
    const { items: announcements, isLoading, error } = useCarouselData<Announcement>('announcements', props);

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-hidden">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="w-80 h-48 bg-muted/50 rounded-2xl" />
                ))}
            </div>
        )
    }
    if (error || announcements.length === 0) return <p className="text-muted-foreground italic text-sm">No hay anuncios para mostrar.</p>;

    return (
        <div className="flex flex-nowrap overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {announcements.map(item => <AnnouncementCard key={item.id} announcement={item as Announcement} variant="carousel" />)}
        </div>
    )
}


export function BannersCarousel(props: CarouselProps) {
    const { items: banners, isLoading, error } = useCarouselData<Banner>('banners', props);
    
    if (isLoading) {
        return (
            <div className="w-full">
                <Skeleton className="w-full aspect-[16/7] rounded-2xl" />
            </div>
        );
    }
    
    if (error || !banners || banners.length === 0) {
        return <p className="text-muted-foreground italic text-sm">No hay banners para mostrar.</p>;
    }
    
    return (
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-4">
                {banners.map((banner, index) => (
                    <CarouselItem key={banner.id} className="basis-full md:basis-1/2 pl-4">
                        <BannerCarouselCard banner={banner as Banner} priority={index === 0} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
        </Carousel>
    );
}

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
} from "firebase/firestore";
import Link from "next/link";
import type { Benefit, SupplierProfile, Announcement, HomeSection, SerializableBenefit } from "@/types/data";
import Image from "next/image";
import { createConverter } from "@/lib/firestore-converter";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";
import { makeBenefitSerializable } from "@/lib/data";
import BenefitCard from "../perks/perk-card";


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
  if (contentType === 'benefits' || contentType === 'suppliers') {
    constraints.push(where('isVisible', '==', true));
  }
  if (contentType === 'announcements') {
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

// --- CAROUSEL FACTORY ---
const createCarousel = <T extends {id: string}>(
    CardComponent: React.FC<any>, 
    collectionName: string, 
    dataKey: string,
    contentType: "benefits" | "suppliers" | "announcements"
) => {
    return function Carousel(props: CarouselProps) {
        const firestore = useFirestore();
        
        const itemsQuery = useMemo(() => {
            if (props.kind !== 'carousel') return null;
            const constraints = buildConstraints(props);
            return query(collection(firestore, collectionName).withConverter(createConverter<T>()), ...constraints);
        }, [firestore, props]);

        const { data: items, isLoading, error } = useCollectionOnce(itemsQuery);
        
        const sortedItems = useMemo(() => {
            if (!items) return [];
            // Client-side sort for suppliers to avoid index on name
            if (props.kind === 'carousel' && props.contentType === 'suppliers' && props.query?.sort?.field === 'name') {
                return [...items].sort((a: any, b: any) => {
                    const direction = props.query?.sort?.direction === 'asc' ? 1 : -1;
                    return a.name.localeCompare(b.name) * direction;
                });
            }
            return items;
        }, [items, props]);
        
        const processedItems = useMemo(() => {
            if (!sortedItems) return [];
            if (contentType === 'benefits') {
                 return sortedItems.map(b => makeBenefitSerializable(b as unknown as Benefit));
            }
            return sortedItems;
        }, [sortedItems, contentType]);


        const skeletonHeight = collectionName === 'benefits' ? 'h-[280px]' : 'h-[150px]';

        if (isLoading) {
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

export const BenefitsCarousel = createCarousel<Benefit>(BenefitCard, 'benefits', 'benefit', 'benefits');
export const SuppliersCarousel = createCarousel<SupplierProfile>(SupplierCard, 'roles_supplier', 'supplier', 'suppliers');
export const AnnouncementsCarousel = createCarousel<Announcement>(AnnouncementCard, 'announcements', 'announcement', 'announcements');

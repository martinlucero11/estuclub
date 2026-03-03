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
  WhereFilterOp,
} from "firebase/firestore";
import Link from "next/link";
import type { Benefit, SupplierProfile, Announcement, WhereFilter } from "@/types/data";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createConverter } from "@/lib/firestore-converter";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import dynamic from 'next/dynamic';

const RedeemBenefitDialog = dynamic(() => import('@/components/perks/redeem-perk-dialog'), { ssr: false });


// --- TYPE DEFINITIONS for Query Building ---
type SortSpec = { field: string; direction: "asc" | "desc" };


// --- HELPER FUNCTION for SAFE Query Building ---
const buildConstraints = ({
  collectionName,
  filters,
  sort,
  limitCount = 10,
  defaultFilters = [],
}: {
  collectionName: string;
  filters?: WhereFilter[];
  sort?: SortSpec;
  limitCount?: number;
  defaultFilters?: WhereFilter[];
}): QueryConstraint[] => {
  const constraints: QueryConstraint[] = [];

  // Combine default and component-specific filters
  const allFilters = [...defaultFilters, ...(filters || [])];

  // Apply visibility filter by default unless it's already specified for these collections
  if (['benefits', 'roles_supplier'].includes(collectionName) && !allFilters.some(f => f.field === 'isVisible')) {
    constraints.push(where('isVisible', '==', true));
  }

  // Convert structured filter objects into actual Firestore 'where' constraints
  allFilters.forEach((f) => {
    if (f.field && f.op && f.value !== undefined) {
      constraints.push(where(f.field, f.op, f.value));
    }
  });

  // IMPORTANT: For suppliers, sorting is handled client-side to avoid mandatory composite indexes.
  if (sort && sort.field && collectionName !== 'roles_supplier') {
    constraints.push(orderBy(sort.field, sort.direction));
  } else if (!sort) {
     // Add a sensible default sort order if none is provided
    if (collectionName === 'benefits') {
        constraints.push(orderBy('createdAt', 'desc'));
    } else if (collectionName === 'announcements') {
        constraints.push(orderBy('createdAt', 'desc'));
    }
  }
  
  constraints.push(limit(limitCount));

  return constraints;
};


// --- BENEFIT CARD ---
const BenefitCard = ({ benefit, supplier }: { benefit: Benefit, supplier?: SupplierProfile }) => {
    const supplierInitials = getInitials(benefit.supplierName || 'S');

    const redeemButton = (
        <Button
            size="sm"
            variant="secondary"
            className="rounded-full group-hover:bg-[#d83762] group-hover:text-white transition-colors"
            onClick={(e) => {
                // This is crucial to prevent the parent Link from navigating
                e.preventDefault();
            }}
        >
            Ver
        </Button>
    );

    return (
        <div className="flex-shrink-0 w-[260px] md:w-[280px] snap-start">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                <Link href={`/benefits/${benefit.id}`} className="block">
                    <div className="relative h-32 w-full">
                        <Image 
                            src={benefit.imageUrl || "https://picsum.photos/seed/benefit/280/128"}
                            alt={benefit.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        {supplier?.logoUrl && (
                            <div className="absolute top-3 right-3 bg-white p-1 rounded-full shadow-md">
                                <Image src={supplier.logoUrl} alt={`${supplier.name} logo`} width={32} height={32} className="rounded-full" />
                            </div>
                        )}
                    </div>
                    <div className="p-4 space-y-2">
                        <h3 className="text-lg font-bold tracking-tight line-clamp-1 group-hover:text-[#d83762] transition-colors">
                            {benefit.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 h-[40px]">
                            {benefit.description}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                           <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={supplier?.logoUrl} alt={supplier?.name || ''} />
                                    <AvatarFallback className="text-xs">{supplierInitials}</AvatarFallback>
                                </Avatar>
                               <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{benefit.supplierName}</span>
                           </div>
                            <RedeemBenefitDialog benefit={benefit as any}>
                                {redeemButton}
                            </RedeemBenefitDialog>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

// --- SUPPLIER CARD ---
const SupplierCard = ({ supplier }: { supplier: SupplierProfile }) => {
    const initials = getInitials(supplier.name);
    return (
        <Link href={`/proveedores/${supplier.slug}`} className="block flex-shrink-0 snap-start text-center group w-24">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-card hover:bg-accent transition-colors flex items-center justify-center">
                 <Avatar className="h-12 w-12">
                    <AvatarImage src={supplier.logoUrl} alt={supplier.name} className="object-cover group-hover:scale-110 transition-transform" />
                    <AvatarFallback className="text-xl font-bold bg-transparent">{initials}</AvatarFallback>
                </Avatar>
            </div>
            <p className="text-sm font-semibold text-center mt-2 line-clamp-1">{supplier.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">{supplier.type}</p>
        </Link>
    );
};


// --- ANNOUNCEMENT CARD ---
const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => (
    <Link href={announcement.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block flex-shrink-0 snap-start group w-80">
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
    defaultFilters: WhereFilter[] = []
) => {
    return function Carousel({ filters, sort }: { filters?: WhereFilter[], sort?: SortSpec }) {
        const firestore = useFirestore();
        
        const itemsQuery = useMemo(() => {
            // Build the query safely using the helper function
            const constraints = buildConstraints({
                collectionName,
                filters,
                sort,
                limitCount: 10,
                defaultFilters: defaultFilters,
            });

            return query(
                collection(firestore, collectionName).withConverter(createConverter<T>()),
                ...constraints
            );
        }, [firestore, filters, sort]);

        const { data: items, isLoading, error } = useCollectionOnce(itemsQuery);

        const suppliersQuery = useMemo(() => 
            collectionName === 'benefits' ? query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())) : null
        , [firestore, collectionName]);
        const { data: suppliers } = useCollectionOnce(suppliersQuery);
        
        const sortedItems = useMemo(() => {
            if (!items) return [];
            // Client-side sorting for suppliers to avoid index requirements
            if (collectionName === 'roles_supplier' && sort && sort.field) {
                return [...items].sort((a: any, b: any) => {
                    if (a[sort.field] < b[sort.field]) return sort.direction === 'asc' ? -1 : 1;
                    if (a[sort.field] > b[sort.field]) return sort.direction === 'asc' ? 1 : -1;
                    return 0;
                });
            }
            return items;
        }, [items, sort]);

        const skeletonHeight = collectionName === 'benefits' ? 'h-[280px]' : 'h-[150px]';

        if (isLoading) {
            return (
                <div className={`flex gap-4 overflow-hidden`}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`flex-shrink-0 w-[280px] ${skeletonHeight} bg-muted/50 rounded-3xl animate-pulse`}></div>
                    ))}
                </div>
            )
        }

        if (error || !sortedItems || sortedItems.length === 0) {
            return <p className="text-muted-foreground italic">No hay contenido disponible por el momento.</p>;
        }

        return (
             <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {collectionName === 'benefits' ? 
                    sortedItems.map(item => {
                        const typedItem = item as unknown as Benefit;
                        const local = suppliers?.find(s => s.id === typedItem.ownerId || s.name === typedItem.supplierName);
                        return <BenefitCard 
                            key={item.id} 
                            benefit={typedItem} 
                            supplier={local} 
                        />
                    }) :
                    sortedItems.map(item => <CardComponent key={item.id} {...{ [dataKey]: item }} />)
                }
            </div>
        )
    }
}

export const BenefitsCarousel = createCarousel<Benefit>(BenefitCard, 'benefits', 'benefit');
export const SuppliersCarousel = createCarousel<SupplierProfile>(SupplierCard, 'roles_supplier', 'supplier');
export const AnnouncementsCarousel = createCarousel<Announcement>(AnnouncementCard, 'announcements', 'announcement', [{field: 'status', op: '==', value: 'approved'}]);

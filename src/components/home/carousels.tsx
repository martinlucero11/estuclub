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
import type { Benefit, SupplierProfile, Announcement, WhereFilter, HomeSection } from "@/types/data";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createConverter } from "@/lib/firestore-converter";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import dynamic from 'next/dynamic';
import { Card } from "../ui/card";
import { Award } from "lucide-react";

const RedeemBenefitDialog = dynamic(() => import('@/components/perks/redeem-perk-dialog'), { ssr: false });

type CarouselProps = HomeSection['block'];

const buildConstraints = ({
  contentType,
  query: queryConfig,
}: CarouselProps): QueryConstraint[] => {
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


// --- BENEFIT CARD ---
const BenefitCard = ({ benefit, supplier }: { benefit: Benefit, supplier?: SupplierProfile }) => {
    const supplierInitials = getInitials(benefit.supplierName || 'S');

    const redeemButton = (
        <Button
            size="sm"
            className="rounded-full bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors"
            onClick={(e) => {
                e.preventDefault();
            }}
        >
            Canjear
        </Button>
    );

    return (
        <div className="w-[280px] snap-start">
             <Card className="overflow-hidden group transition-all duration-300 hover:shadow-lg">
                <Link href={`/benefits/${benefit.id}`} className="block">
                    <div className="relative h-40 w-full">
                        <Image 
                            src={benefit.imageUrl}
                            alt={benefit.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/80 px-2 py-1 text-xs font-bold text-primary-foreground backdrop-blur-sm">
                            <Award className="h-3 w-3" />
                            <span>{benefit.points} PTS</span>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        <h3 className="font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
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
                               <span className="text-xs font-semibold text-muted-foreground">{benefit.supplierName}</span>
                           </div>
                            <RedeemBenefitDialog benefit={benefit as any}>
                                {redeemButton}
                            </RedeemBenefitDialog>
                        </div>
                    </div>
                </Link>
            </Card>
        </div>
    );
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
    dataKey: string
) => {
    return function Carousel(props: CarouselProps) {
        const firestore = useFirestore();
        
        const itemsQuery = useMemo(() => {
            const constraints = buildConstraints({ contentType: collectionName as any, ...props });
            return query(collection(firestore, collectionName).withConverter(createConverter<T>()), ...constraints);
        }, [firestore, props]);

        const { data: items, isLoading, error } = useCollectionOnce(itemsQuery);
        
        const suppliersQuery = useMemo(() => 
            collectionName === 'benefits' ? query(collection(firestore, 'roles_supplier').withConverter(createConverter<SupplierProfile>())) : null
        , [firestore]);
        const { data: suppliers } = useCollectionOnce(suppliersQuery);
        
        const sortedItems = useMemo(() => {
            if (!items) return [];
            // Client-side sort for suppliers to avoid index on name
            if (collectionName === 'suppliers' && props.query?.sort?.field === 'name') {
                return [...items].sort((a: any, b: any) => {
                    const direction = props.query?.sort?.direction === 'asc' ? 1 : -1;
                    return a.name.localeCompare(b.name) * direction;
                });
            }
            return items;
        }, [items, props.query?.sort]);

        const skeletonHeight = collectionName === 'benefits' ? 'h-[280px]' : 'h-[150px]';

        if (isLoading) {
            return (
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`w-[280px] ${skeletonHeight} bg-muted/50 rounded-3xl animate-pulse`}></div>
                    ))}
                </div>
            )
        }

        if (error || !sortedItems || sortedItems.length === 0) {
            return <p className="text-muted-foreground italic text-sm">No hay contenido para mostrar.</p>;
        }

        return (
             <div className="flex flex-nowrap overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {collectionName === 'benefits' ? 
                    sortedItems.map(item => {
                        const typedItem = item as unknown as Benefit;
                        const supplier = suppliers?.find(s => s.id === typedItem.ownerId);
                        return <BenefitCard key={item.id} benefit={typedItem} supplier={supplier} />
                    }) :
                    sortedItems.map(item => <CardComponent key={item.id} {...{ [dataKey]: item }} />)
                }
            </div>
        )
    }
}

export const BenefitsCarousel = createCarousel<Benefit>(BenefitCard, 'benefits', 'benefit');
export const SuppliersCarousel = createCarousel<SupplierProfile>(SupplierCard, 'suppliers', 'supplier');
export const AnnouncementsCarousel = createCarousel<Announcement>(AnnouncementsCarousel, 'announcements', 'announcement');

    
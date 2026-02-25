'use client';
import { useMemo } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, limit } from "firebase/firestore"; 
import Link from "next/link";
import type { Benefit, Supplier, Announcement } from "@/types/data";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createConverter } from "@/lib/firestore-converter";

// --- BENEFIT CARD (AVATAR LOGIC IS CORRECT) ---
const BenefitCard = ({ benefit, supplier }: { benefit: Benefit, supplier?: Supplier }) => {
    return (
        <div className="flex-shrink-0 w-[260px] md:w-[280px] snap-start">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow duration-300 overflow-hidden group">
                <Link href={`/benefit/${benefit.id}`} className="block">
                    <div className="relative h-32 w-full">
                        <Image 
                            src={benefit.imageUrl || "/placeholder.png"}
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
                               {supplier?.logoUrl ? (
                                   <Image src={supplier.logoUrl} alt={`${supplier.name} logo`} width={20} height={20} className="rounded-full"/>
                               ) : <div className="w-5 h-5 bg-muted rounded-full"/>}
                               <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{benefit.supplierName}</span>
                           </div>
                            <Button size="sm" variant="secondary" className="rounded-full group-hover:bg-[#d83762] group-hover:text-white transition-colors">
                                Ver
                            </Button>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

// --- SUPPLIER CARD ---
const SupplierCard = ({ supplier }: { supplier: Supplier }) => (
    <Link href={`/supplier/${supplier.id}`} className="block flex-shrink-0 snap-start text-center group w-24">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-[#d83762]/10 hover:bg-[#d83762]/20 transition-colors flex items-center justify-center">
            <Image 
                src={supplier.logoUrl || '/placeholder.png'}
                alt={`${supplier.name} logo`}
                width={48}
                height={48}
                className="rounded-full object-contain group-hover:scale-110 transition-transform"
            />
        </div>
        <p className="text-sm font-semibold text-center mt-2 line-clamp-1">{supplier.name}</p>
        <p className="text-xs text-muted-foreground line-clamp-1">{supplier.type}</p>
    </Link>
);

// --- ANNOUNCEMENT CARD ---
const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => (
    <Link href={announcement.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="block flex-shrink-0 snap-start group w-80">
        <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-sm">
            <Image 
                src={announcement.imageUrl || '/placeholder.png'}
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

// --- CAROUSELS (DATA LOGIC REPAIRED) ---
const createCarousel = <T extends {id: string}>(CardComponent: React.FC<any>, collectionName: string, dataKey: string) => {
    return function Carousel() {
        const firestore = useFirestore();
        
        const itemsQuery = useMemo(() => query(collection(firestore, collectionName).withConverter(createConverter<T>()), limit(10)), [firestore, collectionName]);
        const { data: items, isLoading, error } = useCollection(itemsQuery);

        const suppliersQuery = useMemo(() => 
            collectionName === 'benefits' ? query(collection(firestore, 'roles_supplier').withConverter(createConverter<Supplier>())) : null
        , [firestore, collectionName]);
        const { data: suppliers } = useCollection(suppliersQuery);
        
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

        if (error || !items || items.length === 0) {
            return <p className="text-muted-foreground italic">No hay contenido disponible por el momento.</p>;
        }

        return (
             <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {collectionName === 'benefits' ? 
                    items.map(item => {
                        const typedItem = item as unknown as Benefit;
                        const local = suppliers?.find(s => s.id === typedItem.ownerId || s.name === typedItem.supplierName);
                        return <BenefitCard 
                            key={item.id} 
                            benefit={typedItem} 
                            supplier={local} 
                        />
                    }) :
                    items.map(item => <CardComponent key={item.id} {...{ [dataKey]: item }} />)
                }
            </div>
        )
    }
}

export const BenefitsCarousel = createCarousel(BenefitCard, 'benefits', 'benefit');
export const SuppliersCarousel = createCarousel(SupplierCard, 'roles_supplier', 'supplier');
export const AnnouncementsCarousel = createCarousel(AnnouncementCard, 'announcements', 'announcement');

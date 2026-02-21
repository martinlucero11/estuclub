
'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import type { Perk, SerializablePerk, SupplierProfile, Announcement, SerializableAnnouncement } from '@/lib/data';
import { makePerkSerializable, makeAnnouncementSerializable } from '@/lib/data';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AnnouncementCard from '@/components/announcements/announcement-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Gift, Megaphone } from 'lucide-react';

// --- PERK CARD (Carousel Item) ---
const PerkCard = ({ perk }: { perk: SerializablePerk }) => {
    const hasLogo = perk.imageUrl && perk.imageUrl !== '';
    const initial = perk.title.charAt(0).toUpperCase();

    return (
        <Link href={`/benefits#${perk.id}`} passHref className="transition-transform hover:-translate-y-1 block w-72 flex-shrink-0 snap-start">
            <Card className="h-full w-full overflow-hidden">
                <CardContent className="flex h-full flex-col p-0">
                     <div className="relative h-32 w-full bg-muted flex items-center justify-center">
                        {hasLogo ? (
                             <Image
                                src={perk.imageUrl}
                                alt={`${perk.title} logo`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                             />
                        ) : (
                            <span className="text-4xl font-bold text-muted-foreground">{initial}</span>
                        )}
                    </div>
                    <div className="p-4 flex-grow flex flex-col">
                        <div className="flex-grow space-y-1">
                            <p className="font-semibold text-foreground line-clamp-2">{perk.title}</p>
                            <p className="text-xs text-muted-foreground">{perk.category}</p>
                        </div>
                        <p className="mt-2 text-lg font-extrabold text-primary line-clamp-1">{perk.description.split('.')[0]}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};


// --- BENEFITS CAROUSEL ---
export const BenefitsCarousel = ({ filter }: { filter?: string }) => {
    const firestore = useFirestore();
    
    const perksQuery = useMemoFirebase(() => {
        let q = query(collection(firestore, 'benefits'), where('active', '==', true), limit(10));
        if (filter === 'featured') {
            q = query(q, where('isFeatured', '==', true));
        } else if (filter) {
            q = query(q, where('category', '==', filter));
        }
        return q;
    }, [firestore, filter]);

    const { data: perks, isLoading } = useCollection<Perk>(perksQuery);

    const serializablePerks: SerializablePerk[] = useMemo(() => {
        if (!perks) return [];
        return perks.map(makePerkSerializable);
    }, [perks]);

    if(isLoading) return null; // Loading is handled by Suspense boundary in dynamic import
    if(!serializablePerks || serializablePerks.length === 0) {
        if (filter === 'featured') {
             return (
                <EmptyState 
                    icon={Gift}
                    title="Nada destacado por ahora"
                    description="Vuelve más tarde para ver las últimas novedades."
                />
            );
        }
        return null;
    }


    return (
        <div className="flex w-full flex-nowrap gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
            {serializablePerks.map((perk) => (
                <PerkCard key={perk.id} perk={perk} />
            ))}
        </div>
    );
};



// --- SUPPLIER CARD (Carousel Item) ---
const SupplierCard = ({ supplier }: { supplier: SupplierProfile }) => {
    const supplierInitials = supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <Link href={`/proveedores/${supplier.slug}`} passHref>
             <div className="w-[88px] flex-shrink-0 flex flex-col items-center text-center gap-3 snap-start group">
                <div className="w-full h-[88px] rounded-[22px] bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:shadow-md transition-shadow overflow-hidden flex items-center justify-center">
                    <Avatar className="h-full w-full rounded-none">
                         <AvatarImage
                            src={supplier.logoUrl || undefined}
                            alt={supplier.name}
                            className="object-cover"
                            sizes="33vw"
                         />
                        <AvatarFallback className="rounded-none bg-transparent text-3xl font-bold text-muted-foreground">
                            {supplierInitials}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="w-full">
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 w-full truncate leading-tight">{supplier.name}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 w-full capitalize truncate leading-tight">{supplier.type}</p>
                </div>
            </div>
        </Link>
    );
};


// --- SUPPLIERS CAROUSEL ---
export const SuppliersCarousel = ({ filter }: { filter?: 'featured' | 'new' | 'all' }) => {
    const firestore = useFirestore();

    const suppliersQuery = useMemoFirebase(() => {
        let q = query(collection(firestore, 'roles_supplier'), limit(10));
        if (filter === 'featured') {
            q = query(q, where('isFeatured', '==', true));
        } else if (filter === 'new') {
            q = query(q, orderBy('createdAt', 'desc'));
        } else {
            q = query(q, orderBy('name'));
        }
        return q;
    }, [firestore, filter]);

    const { data: suppliers, isLoading } = useCollection<SupplierProfile>(suppliersQuery);

    if (isLoading) return null;
    if (!suppliers || suppliers.length === 0) {
        let title = "No hay proveedores";
        let description = "Vuelve más tarde para ver los proveedores.";
        if (filter === 'featured') {
            title = "No hay proveedores destacados";
            description = "Aún no hemos destacado ningún proveedor.";
        } else if (filter === 'new') {
            title = "No hay nuevos proveedores";
            description = "No se han añadido nuevos proveedores recientemente.";
        }
        return (
            <EmptyState icon={Users} title={title} description={description} />
        );
    }

    return (
        <div className="flex w-full flex-nowrap gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
        </div>
    );
};

// --- ANNOUNCEMENTS CAROUSEL ---
export const AnnouncementsCarousel = () => {
    const firestore = useFirestore();
    const announcementsQuery = useMemoFirebase(() => query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'), limit(10)), [firestore]);
    const { data: announcementsData, isLoading } = useCollection<Announcement>(announcementsQuery);

    const announcements = useMemo(() => {
        if (!announcementsData) return [];
        return announcementsData.map(makeAnnouncementSerializable);
    }, [announcementsData]);

    if (isLoading) return null;
    if (!announcements || announcements.length === 0) {
        return (
            <EmptyState
                icon={Megaphone}
                title="No hay anuncios"
                description="No hay nada nuevo que anunciar por ahora."
            />
        );
    }
    
    return (
        <div className="flex w-full flex-nowrap gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
            {announcements.map((announcement) => (
                <div key={announcement.id} className="w-80 flex-shrink-0 snap-start">
                    <AnnouncementCard announcement={announcement} variant="carousel" className="h-48"/>
                </div>
            ))}
        </div>
    );
}


'use client';

import { ArrowRight, ChevronDown, MapPin, Gift, Users, Building, Briefcase, Heart, ShoppingBag, Wrench, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/layout/main-layout';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDocOnce, useDoc } from '@/firebase';
import { collection, query, where, limit, doc, orderBy } from 'firebase/firestore';
import type { Perk, Banner, SerializablePerk, Category, HomeSection, SerializableAnnouncement } from '@/lib/data';
import type { SupplierProfile, CluberCategory } from '@/types/data';
import { makePerkSerializable, makeAnnouncementSerializable } from '@/lib/data';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { getIcon } from '@/components/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AnnouncementCard from '@/components/announcements/announcement-card';


// --- STATIC DATA ---
const bannerColors: { [key: string]: string } = {
    pink: "bg-pink-100 text-pink-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
};

const categoryIcons: Record<CluberCategory, React.ElementType> = {
    Comercio: ShoppingBag,
    Profesional: Briefcase,
    Empresa: Building,
    Emprendimiento: Users,
    Salud: Heart,
    Estética: Briefcase,
    Servicios: Wrench,
};

// --- CATEGORY GRID ---
const CategoryGrid = () => {
    const firestore = useFirestore();
    const categoriesQuery = useMemoFirebase(() => query(collection(firestore, 'categories')), [firestore]);
    const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

    if (isLoading) {
        return (
            <div className="mt-2 grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex-shrink-0">
                        <Card className="flex h-24 w-full flex-col items-center justify-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </Card>
                    </div>
                ))}
            </div>
        )
    }
    
    if (!categories || categories.length === 0) return null;

    return (
        <div className="mt-2 grid grid-cols-4 gap-3">
            {categories.map((category) => {
                const Icon = getIcon(category.iconName);
                return (
                    <Link key={category.id} href={`/benefits?category=${encodeURIComponent(category.name)}`} className="flex-shrink-0">
                        <Card className="flex h-24 w-full flex-col items-center justify-center gap-2 transition-transform hover:-translate-y-1">
                            <Icon className={`h-8 w-8 ${category.colorClass}`} strokeWidth={1.5} />
                            <span className="text-xs text-center font-medium text-muted-foreground">{category.name}</span>
                        </Card>
                    </Link>
                );
            })}
        </div>
    );
};

// --- SINGLE BANNER ---
const SingleBanner = ({ bannerId }: { bannerId: string }) => {
    const firestore = useFirestore();
    const bannerRef = useMemoFirebase(() => doc(firestore, 'banners', bannerId), [firestore, bannerId]);
    const { data: banner, isLoading } = useDocOnce<Banner>(bannerRef);

    if (isLoading) {
        return <Skeleton className="h-24 w-full" />;
    }

    if (!banner || !banner.isActive) {
        return null;
    }
    
    const colorClass = bannerColors[banner.colorScheme] || bannerColors.pink;
    const Wrapper = banner.link ? ({ children }: {children: React.ReactNode}) => <Link href={banner.link!} target="_blank" rel="noopener noreferrer">{children}</Link> : ({ children }: {children: React.ReactNode}) => <>{children}</>;

    return (
        <Wrapper>
            <div className={`${colorClass} p-6 shadow-sm transition-transform hover:-translate-y-1`}>
                <h3 className="text-xl font-extrabold">{banner.title}</h3>
                <p>{banner.description}</p>
            </div>
        </Wrapper>
    )
}


const BenefitsCarousel = ({ filter }: { filter?: string }) => {
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

    if(isLoading) return <PerksSectionSkeleton title={filter || 'Beneficios'} />;
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
        <div className="flex w-full gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {serializablePerks.map((perk) => (
                <PerkCard key={perk.id} perk={perk} />
            ))}
        </div>
    );
};

const PerkCard = ({ perk }: { perk: SerializablePerk }) => {
    const hasLogo = perk.imageUrl && perk.imageUrl !== '';
    const initial = perk.title.charAt(0).toUpperCase();

    return (
        <Link href={`/benefits#${perk.id}`} passHref className="transition-transform hover:-translate-y-1 block">
            <Card className="h-full w-64 flex-shrink-0 overflow-hidden">
                <CardContent className="flex h-full flex-col p-0">
                     <div className="relative h-32 w-full bg-muted flex items-center justify-center">
                        {hasLogo ? (
                             <Image src={perk.imageUrl} alt={`${perk.title} logo`} fill className="object-cover" />
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


const PerksSectionSkeleton = ({ title }: { title: string }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex w-full gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-full w-64 flex-shrink-0">
                    <CardContent className="flex h-full flex-col p-0">
                        <Skeleton className="h-32 w-full rounded-t-2xl" />
                        <div className="p-4 space-y-2">
                             <Skeleton className="h-5 w-3/4" />
                             <Skeleton className="h-4 w-1/2" />
                             <Skeleton className="h-6 w-full mt-2" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);

// --- SUPPLIERS CAROUSELS ---
const SuppliersCarousel = ({ filter }: { filter?: 'featured' | 'new' | 'all' }) => {
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

    if (isLoading) return <SuppliersSectionSkeleton title="Cargando proveedores..." />;
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
        <div className="flex w-full gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {suppliers.map((supplier) => (
                <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
        </div>
    );
};


const SupplierCard = ({ supplier }: { supplier: SupplierProfile }) => {
    const TypeIcon = categoryIcons[supplier.type] || Users;
    const supplierInitials = supplier.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <Link href={`/proveedores/${supplier.slug}`} passHref className="transition-transform hover:-translate-y-1 block">
            <Card className="h-full w-56 flex-shrink-0 overflow-hidden">
                <CardContent className="flex h-full flex-col p-4 items-center justify-center text-center">
                    <Avatar className="h-20 w-20 border-2 border-border group-hover:border-primary transition-colors">
                        <AvatarImage src={supplier.logoUrl} alt={supplier.name} className="object-cover" />
                        <AvatarFallback className="bg-muted text-xl font-semibold text-muted-foreground">
                            {supplierInitials}
                        </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 font-bold text-md text-foreground line-clamp-1">{supplier.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <TypeIcon className="h-4 w-4" />
                        <p className="capitalize">{supplier.type}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

const SuppliersSectionSkeleton = ({ title }: { title: string }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex w-full gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {[...Array(3)].map((_, i) => (
                <Card key={i} className="h-full w-56 flex-shrink-0">
                    <CardContent className="flex h-full flex-col p-4 items-center justify-center">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="mt-4 h-5 w-3/4" />
                        <Skeleton className="mt-1 h-4 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);

// --- ANNOUNCEMENTS CAROUSEL ---
const AnnouncementsCarousel = () => {
    const firestore = useFirestore();
    const announcementsQuery = useMemoFirebase(() => query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc'), limit(10)), [firestore]);
    const { data: announcementsData, isLoading } = useCollection<Announcement>(announcementsQuery);

    const announcements = useMemo(() => {
        if (!announcementsData) return [];
        return announcementsData.map(makeAnnouncementSerializable);
    }, [announcementsData]);

    if (isLoading) return <PerksSectionSkeleton title="Cargando anuncios..." />;
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
        <div className="flex w-full gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {announcements.map((announcement) => (
                <div key={announcement.id} className="w-80 flex-shrink-0">
                    <AnnouncementCard announcement={announcement} variant="carousel" className="h-48"/>
                </div>
            ))}
        </div>
    );
}

const PageSkeleton = () => (
    <MainLayout>
        <div className="mx-auto w-full">
            <div className="mx-auto max-w-2xl space-y-12 pb-8">
                <div className="px-4 space-y-6">
                    <PerksSectionSkeleton title="Cargando..." />
                    <PerksSectionSkeleton title="Cargando..." />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        </div>
    </MainLayout>
)


// --- MAIN PAGE COMPONENT ---
export default function HomePage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

    const homeSectionsQuery = useMemoFirebase(() => {
        if (isUserLoading || user === undefined) return null;
        return query(
            collection(firestore, 'home_sections'),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        )
    }, [firestore, user, isUserLoading]);

    const { data: sections, isLoading: sectionsLoading } = useCollection<HomeSection>(homeSectionsQuery);
    
    type HomeSectionType = typeof import('@/lib/data').homeSectionTypes[number];

    const componentMap: { [key in HomeSectionType]: (section: HomeSection) => React.ReactNode } = {
        categories_grid: (section) => <CategoryGrid />,
        benefits_carousel: (section) => <BenefitsCarousel filter={section.filter} />,
        single_banner: (section) => section.bannerId ? <SingleBanner bannerId={section.bannerId} /> : null,
        suppliers_carousel: (section) => <SuppliersCarousel filter="all" />,
        announcements_carousel: () => <AnnouncementsCarousel />,
        featured_suppliers_carousel: () => <SuppliersCarousel filter="featured" />,
        new_suppliers_carousel: () => <SuppliersCarousel filter="new" />,
    };

    if (sectionsLoading || isUserLoading) {
        return <PageSkeleton />;
    }

  return (
    <MainLayout>
        <div className="mx-auto w-full">
            <div className="mx-auto max-w-2xl space-y-12 pb-8">
                {sections && sections.map(section => {
                    const Component = componentMap[section.type as HomeSectionType];
                    
                    return (
                        <section key={section.id} className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                <h2 className="text-xl font-bold tracking-tight text-foreground">{section.title}</h2>
                                {['benefits_carousel', 'suppliers_carousel', 'featured_suppliers_carousel', 'new_suppliers_carousel'].includes(section.type) && (
                                    <Button variant="link" asChild className="text-sm font-semibold text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
                                        <Link href={section.type.includes('supplier') ? "/proveedores" : "/benefits"}>
                                            Ver todos
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                                 {section.type === 'announcements_carousel' && (
                                    <Button variant="link" asChild className="text-sm font-semibold text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
                                        <Link href="/announcements">
                                            Ver todos
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                            <div className="pl-4">
                                {Component ? Component(section) : null}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    </MainLayout>
  );
}

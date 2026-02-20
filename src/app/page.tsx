
'use client';

import { ArrowRight, ChevronDown, MapPin, Layers, LayoutGrid, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MainLayout from '@/components/layout/main-layout';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDocOnce } from '@/firebase';
import { collection, query, where, limit, doc, orderBy } from 'firebase/firestore';
import type { Perk, Banner, SerializablePerk, Category, HomeSection } from '@/lib/data';
import { makePerkSerializable } from '@/lib/data';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { getIcon } from '@/components/icons';


// --- STATIC DATA ---
const bannerColors: { [key: string]: string } = {
    pink: "bg-pink-100 text-pink-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
};


// --- HEADER ---
const HomeHeader = () => (
  <div className="flex items-center justify-between p-4">
    <Button variant="ghost" className="flex items-center gap-2">
      <MapPin className="h-5 w-5 text-primary" />
      <span className="font-semibold">Viendo cerca tuyo</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </Button>
    <div className="flex items-center justify-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
       <span className="font-logo-script text-2xl">EstuClub</span>
    </div>
  </div>
);

// --- CATEGORY GRID ---
const CategoryGrid = () => {
    const firestore = useFirestore();
    const categoriesQuery = useMemoFirebase(() => query(collection(firestore, 'categories')), [firestore]);
    const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);

    if (isLoading) {
        return (
             <div className="px-4">
                <div className="mt-2 grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                         <div key={i} className="flex-shrink-0">
                            <Card className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-4 w-16" />
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    
    if (!categories || categories.length === 0) return null;

    return (
        <section className="px-4">
            <div className="mt-2 grid grid-cols-4 gap-3">
                {categories.map((category) => {
                    const Icon = getIcon(category.iconName);
                    return (
                        <Link key={category.id} href={`/benefits?category=${encodeURIComponent(category.name)}`} className="flex-shrink-0">
                            <Card className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-2xl border-gray-100 bg-white shadow-sm transition-transform hover:-translate-y-1">
                                <Icon className={`h-8 w-8 ${category.colorClass}`} strokeWidth={1.5} />
                                <span className="text-xs text-center font-medium text-muted-foreground">{category.name}</span>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
};

// --- SINGLE BANNER ---
const SingleBanner = ({ bannerId }: { bannerId: string }) => {
    const firestore = useFirestore();
    const bannerRef = useMemoFirebase(() => doc(firestore, 'banners', bannerId), [firestore, bannerId]);
    const { data: banner, isLoading } = useDocOnce<Banner>(bannerRef);

    if (isLoading) {
        return <Skeleton className="h-24 w-full rounded-2xl" />;
    }

    if (!banner || !banner.isActive) {
        return null;
    }
    
    const colorClass = bannerColors[banner.colorScheme] || bannerColors.pink;
    const Wrapper = banner.link ? ({ children }: {children: React.ReactNode}) => <Link href={banner.link!} target="_blank" rel="noopener noreferrer">{children}</Link> : ({ children }: {children: React.ReactNode}) => <>{children}</>;

    return (
        <Wrapper>
            <div className={`${colorClass} rounded-2xl p-6 shadow-sm transition-transform hover:-translate-y-1`}>
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
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center h-48">
                    <Gift className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Nada destacado por ahora</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Vuelve más tarde para ver las últimas novedades.
                    </p>
                </div>
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
        <Link href={`/benefits#${perk.id}`} passHref>
            <Card className="h-full w-64 flex-shrink-0 rounded-2xl border-gray-100 bg-white shadow-sm overflow-hidden transition-transform hover:-translate-y-1">
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
                <Card key={i} className="h-full w-64 flex-shrink-0 rounded-2xl">
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


const PageSkeleton = () => (
    <MainLayout>
        <div className="mx-auto w-full bg-gray-50/50 dark:bg-card">
            <div className="mx-auto max-w-2xl space-y-4 pb-8">
                <HomeHeader />
                <div className="px-4 space-y-6">
                    <PerksSectionSkeleton title="Cargando..." />
                    <PerksSectionSkeleton title="Cargando..." />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    </MainLayout>
)


// --- MAIN PAGE COMPONENT ---
export default function HomePage() {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

    const homeSectionsQuery = useMemoFirebase(() => query(
        collection(firestore, 'home_sections'),
        where('isActive', '==', true),
        orderBy('order', 'asc')
    ), [firestore]);

    const { data: sections, isLoading: sectionsLoading } = useCollection<HomeSection>(homeSectionsQuery);
    
    type HomeSectionType = 'categories_grid' | 'benefits_carousel' | 'single_banner';

    const componentMap: { [key in HomeSectionType]: (section: HomeSection) => React.ReactNode } = {
        categories_grid: (section) => <CategoryGrid />,
        benefits_carousel: (section) => <BenefitsCarousel filter={section.filter} />,
        single_banner: (section) => section.bannerId ? <SingleBanner bannerId={section.bannerId} /> : null,
    };

    if (sectionsLoading || isUserLoading) {
        return <PageSkeleton />;
    }

  return (
    <MainLayout>
        <div className="mx-auto w-full bg-gray-50/50 dark:bg-card">
            <div className="mx-auto max-w-2xl space-y-4 pb-8">
                <HomeHeader />
                {sections && sections.map(section => {
                    const Component = componentMap[section.type as HomeSectionType];
                    return (
                        <section key={section.id} className="space-y-3 py-4">
                            <div className="flex items-center justify-between px-4">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-muted-foreground"/>
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">{section.title}</h2>
                                </div>
                                {section.type === 'benefits_carousel' && (
                                    <Button variant="link" className="text-sm text-primary" asChild>
                                        <Link href="/benefits">
                                            Ver todos
                                            <ArrowRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                            <div className="px-4">
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

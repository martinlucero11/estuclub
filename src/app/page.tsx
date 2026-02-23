
'use client';

import { ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import Link from 'next/link';
import { useCollection, useFirestore, useDocOnce, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc, orderBy } from 'firebase/firestore';
import type { Banner, Category, HomeSection } from '@/lib/data';
import { useMemo, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import WelcomeMessage from '@/components/home/welcome-message';
import dynamic from 'next/dynamic';

// --- STATIC DATA ---
const bannerColors: { [key: string]: string } = {
    pink: "bg-pink-100 text-pink-800",
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
};

// --- CATEGORY GRID (GLOW EFFECT APPLIED) ---
const CategoryGrid = () => {
    const firestore = useFirestore();
    const categoriesQuery = useMemo(() => query(collection(firestore, 'categories')), [firestore]);
    const { data: categories, isLoading } = useCollection<Category>(categoriesQuery);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-24">
                        <Skeleton className="h-24 w-24 rounded-2xl" />
                        <Skeleton className="mt-1 h-4 w-16" />
                    </div>
                ))}
            </div>
        )
    }
    
    if (!categories || categories.length === 0) return null;

    return (
        <div className="relative">
            <div ref={scrollContainerRef} className="flex overflow-x-auto flex-nowrap gap-4 md:gap-6 px-4 pb-4 scroll-smooth w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {categories.map((category) => (
                    <Link key={category.id} href={`/benefits?category=${encodeURIComponent(category.name)}`} className="flex-shrink-0 flex flex-col items-center gap-2 w-24 text-center group">
                        <div className="bg-accent rounded-3xl w-24 h-24 md:w-28 md:h-28 flex items-center justify-center shadow-sm">
                            <span className="text-5xl md:text-6xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.4)]">{category.icon || category.emoji}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-2 text-center">
                            {category.name}
                        </span>
                    </Link>
                ))}
            </div>
             <button onClick={scrollRight} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-lg text-[#d83762] hover:bg-gray-50 cursor-pointer">
                <ChevronRight className="h-6 w-6" />
            </button>
        </div>
    );
};

// --- SINGLE BANNER (LCP Optimized) ---
const SingleBanner = ({ bannerId, isLCP }: { bannerId: string, isLCP?: boolean }) => {
    const firestore = useFirestore();
    const bannerRef = useMemo(() => doc(firestore, 'banners', bannerId), [firestore, bannerId]);
    const { data: banner, isLoading } = useDocOnce<Banner>(bannerRef);

    if (isLoading) {
        return <Skeleton className="h-48 md:h-64 w-full rounded-lg" />;
    }

    if (!banner || !banner.isActive) return null;
    
    const colorClass = bannerColors[banner.colorScheme] || bannerColors.pink;
    const Wrapper = banner.link ? ({ children }: {children: React.ReactNode}) => <Link href={banner.link!} target="_blank" rel="noopener noreferrer" className="block">{children}</Link> : ({ children }: {children: React.ReactNode}) => <div className="block">{children}</div>;

    return (
        <Wrapper>
            <div className={`relative ${colorClass} p-6 shadow-sm transition-transform hover:-translate-y-1 rounded-lg overflow-hidden`}>
                {banner.imageUrl && (
                    <Image
                        src={banner.imageUrl}
                        alt={banner.title}
                        fill
                        className="object-cover"
                        priority={true}
                        sizes="100vw"
                    />
                )}
                <div className="relative z-10">
                    <h3 className="text-xl font-extrabold drop-shadow-md">{banner.title}</h3>
                    <p className="drop-shadow-sm">{banner.description}</p>
                </div>
            </div>
        </Wrapper>
    )
}

// --- SKELETONS (CLS Optimized) ---
const PerksSectionSkeleton = ({ title }: { title: string }) => (
    // CLS FIX: Height adjusted to match final component height (~260px)
    <div className="space-y-3 min-h-[260px]"> 
        <div className="flex items-center justify-between px-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex w-full gap-4 overflow-x-auto pb-4 pl-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="w-64 flex-shrink-0">
                    <Skeleton className="h-32 w-full rounded-t-lg" />
                    <div className="p-4 border border-t-0 rounded-b-lg space-y-2">
                         <Skeleton className="h-5 w-3/4" />
                         <Skeleton className="h-4 w-1/2" />
                         <Skeleton className="h-6 w-full mt-2" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const SuppliersSectionSkeleton = ({ title }: { title: string }) => (
    // CLS FIX: Height adjusted to match final component height (~200px)
    <div className="space-y-3 min-h-[200px]">
        <div className="flex items-center justify-between px-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex w-full gap-4 overflow-x-auto pb-6 pt-2 pl-4">
             {[...Array(4)].map((_, i) => (
                <div key={i} className="w-24 flex-shrink-0 flex flex-col items-center text-center gap-2">
                    <Skeleton className="h-20 w-20 rounded-2xl" />
                    <Skeleton className="mt-1 h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
            ))}
        </div>
    </div>
);

// CLS FIX: Specific skeleton for Announcements to match h-48 cards
const AnnouncementsSectionSkeleton = ({ title }: { title: string }) => (
    <div className="space-y-3 min-h-[240px]"> 
        <div className="flex items-center justify-between px-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex w-full gap-4 overflow-x-auto pb-4 pl-4">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="w-80 flex-shrink-0">
                    {/* h-48 is 12rem = 192px */}
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
            ))}
        </div>
    </div>
);


// --- LAZY LOADED CAROUSELS ---
const BenefitsCarousel = dynamic(() => import('@/components/home/carousels').then(mod => mod.BenefitsCarousel), {
    loading: () => <PerksSectionSkeleton title="Cargando beneficios..." />,
});
const SuppliersCarousel = dynamic(() => import('@/components/home/carousels').then(mod => mod.SuppliersCarousel), {
    loading: () => <SuppliersSectionSkeleton title="Cargando proveedores..." />,
});
const AnnouncementsCarousel = dynamic(() => import('@/components/home/carousels').then(mod => mod.AnnouncementsCarousel), {
    // CLS FIX: Using the new, specific skeleton
    loading: () => <AnnouncementsSectionSkeleton title="Cargando anuncios..." />,
});

const PageSkeleton = () => (
    <MainLayout>
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
             <div className="space-y-2">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="space-y-12 mt-10">
                <PerksSectionSkeleton title="Cargando..." />
                <SuppliersSectionSkeleton title="Cargando..." />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    </MainLayout>
)


// --- MAIN PAGE COMPONENT ---
export default function HomePage() {
  const firestore = useFirestore();

    const homeSectionsQuery = useMemo(() => 
        query(
            collection(firestore, 'home_sections'),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        )
    , [firestore]);

    const { data: sections, isLoading: sectionsLoading } = useCollection<HomeSection>(homeSectionsQuery);
    
    type HomeSectionType = typeof import('@/lib/data').homeSectionTypes[number];

    const componentMap: { [key in HomeSectionType]: (section: HomeSection, isFirst: boolean) => React.ReactNode } = {
        categories_grid: () => <CategoryGrid />,
        single_banner: (section, isFirst) => section.bannerId ? <SingleBanner bannerId={section.bannerId} isLCP={isFirst} /> : null,
        benefits_carousel: (section) => <BenefitsCarousel filter={section.filter} />,
        suppliers_carousel: () => <SuppliersCarousel filter="all" />,
        announcements_carousel: () => <AnnouncementsCarousel />,
        featured_suppliers_carousel: () => <SuppliersCarousel filter="featured" />,
        new_suppliers_carousel: () => <SuppliersCarousel filter="new" />,
    };

    if (sectionsLoading) {
        return <PageSkeleton />;
    }

  return (
    <MainLayout>
        <div className="mx-auto w-full">
             <WelcomeMessage />
            <div className="space-y-6 pb-8 pt-0">
                {sections && sections.map((section, index) => {
                    const Component = componentMap[section.type as HomeSectionType];
                    const isFirstSection = index === 0;
                    
                    if (!Component) return null;

                    return (
                        <section key={section.id} className="space-y-3">
                            <div className="flex items-center justify-between px-4">
                                <h2 className="text-xl font-bold tracking-tight text-foreground">{section.title}</h2>
                                {['benefits_carousel', 'suppliers_carousel', 'featured_suppliers_carousel', 'new_suppliers_carousel'].includes(section.type) && (
                                    <Button variant="link" asChild className="text-sm font-semibold text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
                                        <Link href={section.type.includes('supplier') ? "/proveedores" : "/benefits"}>
                                            Ver todos <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                                 {section.type === 'announcements_carousel' && (
                                    <Button variant="link" asChild className="text-sm font-semibold text-primary/70 hover:text-primary transition-colors flex items-center gap-1">
                                        <Link href="/announcements">
                                            Ver todos <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                            <div className="px-4">
                                {Component(section, isFirstSection)}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    </MainLayout>
  );
}

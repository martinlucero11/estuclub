
'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import WelcomeMessage from '@/components/home/welcome-message';
import dynamic from 'next/dynamic';
import { HomeSection, HomeSectionType, Category, Banner } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';

// --- DYNAMICALLY IMPORTED COMPONENTS ---

const BenefitsCarousel = dynamic(() => import('@/components/home/carousels').then(mod => mod.BenefitsCarousel));
const SuppliersCarousel = dynamic(() => import('@/components/home/carousels').then(mod => mod.SuppliersCarousel));
const AnnouncementsCarousel = dynamic(() => import('@/components/home/carousels').then(mod => mod.AnnouncementsCarousel));
const CategoryGrid = dynamic(() => import('@/components/home/category-grid').then(mod => mod.CategoryGrid));
const SingleBanner = dynamic(() => import('@/components/home/single-banner').then(mod => mod.SingleBanner));


// --- SKELETON LOADER ---

const PageSkeleton = () => (
    <MainLayout>
        <div className="mx-auto w-full max-w-4xl space-y-12 px-4 py-8">
            <div className="space-y-2">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-48 w-full" />
            </div>
             <div className="space-y-3">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    </MainLayout>
);


// --- MAIN PAGE COMPONENT ---

export default function HomePage() {
    const firestore = useFirestore();

    const homeSectionsQuery = useMemo(() => 
        query(
            collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>()),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        )
    , [firestore]);

    const { data: sections, isLoading: sectionsLoading } = useCollection(homeSectionsQuery);
    
    // Map section types to their corresponding components and link paths
    const componentMap: Record<HomeSectionType, {
        component: React.ComponentType<any>,
        link?: string,
        linkText?: string
    }> = {
        categories_grid: { component: CategoryGrid },
        single_banner: { component: SingleBanner },
        benefits_carousel: { component: BenefitsCarousel, link: "/benefits" },
        suppliers_carousel: { component: SuppliersCarousel, link: "/proveedores" },
        announcements_carousel: { component: AnnouncementsCarousel, link: "/announcements" },
    };

    if (sectionsLoading) {
        return <PageSkeleton />;
    }

    return (
        <MainLayout>
            <div className="mx-auto w-full">
                <WelcomeMessage />
                <div className="space-y-10 pb-8 pt-2">
                    {sections && sections.map((section, index) => {
                        const { component: Component, link } = componentMap[section.type] || {};
                        
                        if (!Component) return null;

                        return (
                            <section key={section.id} className="space-y-3">
                                <div className="flex items-center justify-between px-4">
                                    <h2 className="text-xl font-bold tracking-tight text-foreground">{section.title}</h2>
                                    {link && (
                                        <Button variant="link" asChild className="text-sm font-semibold text-primary hover:text-primary/80">
                                            <Link href={link}>
                                                Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                                <div className={section.type !== 'categories_grid' ? 'px-4' : ''}>
                                    <Component {...section} />
                                </div>
                            </section>
                        )
                    })}
                </div>
            </div>
        </MainLayout>
    );
}


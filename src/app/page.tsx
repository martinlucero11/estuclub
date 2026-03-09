'use client';

import { ArrowRight, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import WelcomeMessage from '@/components/home/welcome-message';
import dynamic from 'next/dynamic';
import { HomeSection } from '@/types/data';
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

    if (sectionsLoading) {
        return <PageSkeleton />;
    }

    return (
        <MainLayout>
            <div className="mx-auto w-full">
                <WelcomeMessage />
                <div className="space-y-6 pb-8 pt-2">
                    {sections && sections.length > 0 ? sections.map((section) => {
                        
                        let block: HomeSection['block'] | undefined = section.block;
                        const title = section.title;

                        // --- Backwards Compatibility Layer ---
                        // If 'block' doesn't exist, it's an old section. We normalize it.
                        if (!block) {
                            const oldType = (section as any).type;
                            switch (oldType) {
                                case 'categories_grid':
                                    block = { kind: 'categories' };
                                    break;
                                case 'single_banner':
                                    block = { kind: 'banner', bannerId: (section as any).bannerId };
                                    break;
                                case 'benefits_carousel':
                                    block = { 
                                        kind: 'carousel', 
                                        contentType: 'benefits',
                                        query: (section as any).filter ? { filters: [{ field: 'category', op: '==', value: (section as any).filter }] } : undefined
                                    };
                                    break;
                                case 'suppliers_carousel':
                                    block = { kind: 'carousel', contentType: 'suppliers' };
                                    break;
                                case 'announcements_carousel':
                                    block = { kind: 'carousel', contentType: 'announcements' };
                                    break;
                                case 'featured_suppliers_carousel':
                                    block = { kind: 'carousel', contentType: 'suppliers', query: { filters: [{ field: 'isFeatured', op: '==', value: true }] } };
                                    break;
                                case 'featured_perks':
                                    block = { kind: 'carousel', contentType: 'benefits', query: { filters: [{ field: 'isFeatured', op: '==', value: true }] } };
                                    break;
                                default:
                                    return null; // Unrecognized old type
                            }
                        }
                        // --- End of Backwards Compatibility Layer ---

                        if (!block) { // Final safety check
                            return null;
                        }

                        let Component;
                        const props: any = { ...block, title: title };

                        switch (block.kind) {
                            case 'categories':
                                Component = CategoryGrid;
                                break;
                            case 'banner':
                                Component = SingleBanner;
                                break;
                            case 'carousel':
                                if (block.contentType === 'benefits') Component = BenefitsCarousel;
                                if (block.contentType === 'suppliers') Component = SuppliersCarousel;
                                if (block.contentType === 'announcements') Component = AnnouncementsCarousel;
                                break;
                            default:
                                return null;
                        }

                        if (!Component) return null;
                        const linkPath = block.contentType ? `/${block.contentType === 'suppliers' ? 'proveedores' : block.contentType}` : undefined;

                        return (
                            <section key={section.id} className="space-y-3">
                                <div className="flex items-center justify-between px-4">
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{section.title}</h2>
                                    {linkPath && (
                                        <Button variant="link" asChild className="text-sm font-semibold text-primary hover:text-primary/80">
                                            <Link href={linkPath}>
                                                Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                                <div className={block.kind !== 'categories' ? 'pl-4' : ''}>
                                    <Component {...props} />
                                </div>
                            </section>
                        )
                    }) : (
                        <div className="px-4">
                            <EmptyState icon={LayoutTemplate} title="Página en construcción" description="El administrador todavía no ha añadido contenido a la página de inicio." />
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

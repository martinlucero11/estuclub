
'use client';

import { Suspense, useMemo } from 'react';
import { ArrowRight, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { EmptyState } from '@/components/ui/empty-state';
import { HomeSection } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import HomeSectionRenderer from '@/components/home/home-section-renderer';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const PendingReviews = dynamic(() => import('@/components/reviews/pending-reviews').then(m => m.PendingReviews), { ssr: false });
const WelcomeMessage = dynamic(() => import('@/components/home/welcome-message'), { ssr: false });

function HomeSectionsSkeleton() {
    return (
        <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-48 w-full" />
                </div>
            ))}
        </div>
    );
}

function HomeContent() {
    const firestore = useFirestore();
    const sectionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>()),
            where('isActive', '==', true),
            orderBy('order', 'asc')
        );
    }, [firestore]);

    const { data: sections, isLoading } = useCollection(sectionsQuery);

    if (isLoading) {
        return <HomeSectionsSkeleton />;
    }

    if (!sections || sections.length === 0) {
        return (
            <div>
                <EmptyState icon={LayoutTemplate} title="Página en construcción" description="El administrador todavía no ha añadido contenido a la página de inicio." />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 pt-2 animate-stagger">
            {sections.map((section) => (
                <section key={section.id} className="space-y-4">
                    {section.title && (
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg font-extrabold tracking-tight text-foreground uppercase text-[10px] sm:text-xs text-muted-foreground/80 tracking-[0.2em]">
                                {section.title}
                            </h2>
                            {'contentType' in section.block && section.block.contentType && section.block.contentType !== 'banners' && (
                                <Button variant="ghost" asChild className="h-auto p-0 text-xs font-bold text-primary hover:bg-transparent hover:text-primary/70 transition-colors">
                                    <Link href={`/${section.block.contentType === 'suppliers' ? 'proveedores' : section.block.contentType}`}>
                                        VER TODOS <ArrowRight className="ml-1 h-3 w-3" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    )}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <HomeSectionRenderer section={section} />
                    </div>
                </section>
            ))}
        </div>
    );
}


export default function HomePage() {
    return (
        <MainLayout>
            <div className="mx-auto w-full px-4">
                <WelcomeMessage />
                <PendingReviews />
                <Suspense fallback={<HomeSectionsSkeleton />}>
                    <HomeContent />
                </Suspense>
            </div>
        </MainLayout>
    );
}

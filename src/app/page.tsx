'use client';

import { Suspense, useMemo } from 'react';
import { ArrowRight, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { EmptyState } from '@/components/ui/empty-state';
import WelcomeMessage from '@/components/home/welcome-message';
import { HomeSection } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import HomeSectionRenderer from '@/components/home/home-section-renderer';
import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="space-y-1 pb-8 pt-2">
            {sections.map((section) => (
                <section key={section.id} className="space-y-1">
                    {section.title && (
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold tracking-tight text-foreground">{section.title}</h2>
                            {'contentType' in section.block && section.block.contentType && section.block.contentType !== 'banners' && (
                                <Button variant="link" asChild className="text-sm font-semibold text-primary hover:text-primary/80">
                                    <Link href={`/${section.block.contentType === 'suppliers' ? 'proveedores' : section.block.contentType}`}>
                                        Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    )}
                    <div>
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
                <Suspense fallback={<HomeSectionsSkeleton />}>
                    <HomeContent />
                </Suspense>
            </div>
        </MainLayout>
    );
}

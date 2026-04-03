
'use client';

import { Suspense, useMemo, useEffect, useState } from 'react';
import { ArrowRight, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import { ModeToggle } from '@/components/layout/mode-toggle';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { EmptyState } from '@/components/ui/empty-state';
import { HomeSection } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { cn } from '@/lib/utils';
import HomeSectionRenderer from '@/components/home/home-section-renderer';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const PendingReviews = dynamic(() => import('@/components/reviews/pending-reviews').then(m => m.PendingReviews), { ssr: false });
const WelcomeMessage = dynamic(() => import('@/components/home/welcome-message'), { ssr: false });
const AvatarOnboarding = dynamic(() => import('@/components/profile/avatar-onboarding').then(m => m.AvatarOnboarding), { ssr: false });
const HomeLoginPopup = dynamic(() => import('@/components/auth/home-login-popup'), { ssr: false });

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
    const { userData, roles } = useUser();
    
    // Default to false if not loaded yet to avoid flickering a student-only view to guests
    const isStudent = userData?.isStudent || false;
    const isAdmin = roles.includes('admin');
    const targetBoard = (isStudent || isAdmin) ? 'perks' : 'delivery';

    const sectionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>()),
            orderBy('order', 'asc')
        );
    }, [firestore]);

    const { data: allSections, isLoading } = useCollection(sectionsQuery);

    const sections = useMemo(() => {
        if (!allSections) return [];
        // Filter sections based on the active "world"
        return allSections.filter(s => s.isActive && (s.targetBoard || 'perks') === targetBoard);
    }, [allSections, targetBoard]);

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
        <div className="pb-12 pt-2 animate-stagger">
            {sections.map((section) => (
                <section key={section.id} className={cn(section.title ? "space-y-4 mb-10" : "mb-4")}>
                    {section.title && (
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg font-extrabold tracking-tight text-foreground uppercase text-[12px] sm:text-sm text-foreground/80 tracking-[0.2em]">
                                {section.title}
                            </h2>
                            {'contentType' in section.block && section.block.contentType && section.block.contentType !== 'banners' && (
                                <Button variant="ghost" asChild className="h-auto p-0 text-sm font-bold text-primary hover:bg-transparent hover:text-primary/70 transition-colors">
                                    <Link href={
                                        ['suppliers', 'minisuppliers', 'supplierpromo', 'suppliers_nearby'].includes(section.block.contentType as string)
                                            ? '/proveedores' 
                                            : ['delivery_suppliers', 'delivery_products', 'delivery_promos', 'productexmplsupplier'].includes(section.block.contentType as string)
                                                ? '/delivery'
                                                : ['benefits_nearby', 'perks'].includes(section.block.contentType as string)
                                                    ? '/benefits'
                                                    : `/${section.block.contentType}`
                                    }>
                                        VER TODOS <ArrowRight className="ml-1 h-4 w-4" />
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
    const { roles, isUserLoading } = useUser();
    const router = useRouter();
    const [hasRedirected, setHasRedirected] = useState(false);

    useEffect(() => {
        if (isUserLoading || hasRedirected) return;
        
        if (roles.includes('admin')) {
            setHasRedirected(true);
            router.replace('/panel-admin');
            return;
        }

        if (roles.includes('supplier')) {
            setHasRedirected(true);
            router.replace('/panel-cluber');
            return;
        }
    }, [roles, isUserLoading, router, hasRedirected]);

    return (
        <MainLayout>
            <HomeLoginPopup />
            <div className="mx-auto w-full px-4 pt-4">
                <ModeToggle />
                <WelcomeMessage />
                <Suspense fallback={<HomeSectionsSkeleton />}>
                    <HomeContent />
                </Suspense>
                <AvatarOnboarding />
            </div>
        </MainLayout>
    );
}


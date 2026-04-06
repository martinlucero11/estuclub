
'use client';

import { Suspense, useMemo, useEffect, useState } from 'react';
import { ArrowRight, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
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
const OrderTracker = dynamic(() => import('@/components/delivery/order-tracker').then(m => m.OrderTracker), { ssr: false });

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

const HomeBoardSelector = dynamic(() => import('@/components/home/home-board-selector'), { ssr: false });
const TurnsBoard = dynamic(() => import('@/components/home/turns-board'), { ssr: false });

function HomeContent({ activeBoard }: { activeBoard: 'perks' | 'delivery' | 'turns' }) {
    const firestore = useFirestore();
    const { userData } = useUser();
    
    const targetBoard = activeBoard;

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
        return allSections.filter(s => s.isActive && s.targetBoard === activeBoard);
    }, [allSections, activeBoard]);

    if (activeBoard === 'turns') {
        return <TurnsBoard />;
    }

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
                            {section.block && 'contentType' in section.block && section.block.contentType && section.block.contentType !== 'banners' && (
                                <Button variant="ghost" asChild className="h-auto p-0 text-sm font-bold text-primary hover:bg-transparent hover:text-primary/70 transition-colors">
                                    <Link href={
                                        ['suppliers', 'minisuppliers', 'supplierpromo', 'suppliers_nearby'].includes(section.block.contentType as any)
                                            ? '/proveedores' 
                                            : ['delivery_suppliers', 'delivery_products', 'delivery_promos', 'productexmplsupplier'].includes(section.block.contentType as any)
                                                ? '/delivery'
                                                : ['benefits_nearby', 'perks'].includes(section.block.contentType as any)
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
    const { roles, userData, isUserLoading } = useUser();
    const router = useRouter();
    const [hasRedirected, setHasRedirected] = useState(false);
    
    const isStudent = userData?.isStudent || false;
    const isAdmin = roles.includes('admin');
    const canSwitch = isStudent || isAdmin || true; // Everyone can switch except for perks (handled in selector)

    const [activeBoard, setActiveBoard] = useState<'perks' | 'delivery' | 'turns'>('delivery');

    // Effect to set initial board based on user type
    useEffect(() => {
        if (isUserLoading) return;
        // Logic: Students default to perks, Normal users default to delivery
        if (isStudent) {
            setActiveBoard('perks');
        } else {
            setActiveBoard('delivery');
        }
    }, [isStudent, isUserLoading]);

    useEffect(() => {
        if (isUserLoading || hasRedirected) return;
        
        if (roles.includes('admin')) {
            // Optional: Don't redirect if admin wants to see the home
            // For now keeping it since it's the existing logic
            // router.replace('/panel-admin');
            // return;
        }

        if (roles.includes('supplier')) {
            setHasRedirected(true);
            router.replace('/panel-cluber');
            return;
        }
    }, [roles, isUserLoading, router, hasRedirected]);

    return (
        <MainLayout>
            <div className="mx-auto w-full px-4 pt-4">
                {canSwitch && (
                    <div className="mb-8">
                        <HomeBoardSelector 
                            activeBoard={activeBoard} 
                            onChange={setActiveBoard} 
                            isStudent={isStudent}
                        />
                    </div>
                )}

                {/* MISSION 3: Real-time Order Tracking Widget */}
                {activeBoard !== 'turns' && <OrderTracker />}

                <div className="flex justify-between items-start mb-6">
                    <WelcomeMessage />
                </div>

                <Suspense fallback={<HomeSectionsSkeleton />}>
                    <HomeContent activeBoard={activeBoard} />
                </Suspense>
                
                <AvatarOnboarding />
            </div>
        </MainLayout>
    );
}


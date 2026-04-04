'use client';

import { Suspense, useMemo, useEffect, useState } from 'react';
import { LayoutTemplate } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, Timestamp } from 'firebase/firestore';
import { EmptyState } from '@/components/ui/empty-state';
import { HomeSection, HomeConfig } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { cn } from '@/lib/utils';
import HomeSectionRenderer from '@/components/home/home-section-renderer';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

const WelcomeMessage = dynamic(() => import('@/components/home/welcome-message'), { ssr: false });
const AvatarOnboarding = dynamic(() => import('@/components/profile/avatar-onboarding').then(m => m.AvatarOnboarding), { ssr: false });
const HomeHero = dynamic(() => import('@/components/home/home-hero'), { ssr: false });
const BannersCarousel = dynamic(() => import('@/components/home/carousels').then(m => m.BannersCarousel), { ssr: false });

function HomeSectionsSkeleton() {
    return (
        <div className="space-y-12">
            <Skeleton className="h-[400px] w-full rounded-[3rem]" />
            <div className="space-y-8 px-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-6 w-1/3" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-40 rounded-2xl" />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HomeContent() {
    const firestore = useFirestore();
    const { userData, roles } = useUser();
    
    // Global Home Config
    const configRef = useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings', 'home_config').withConverter(createConverter<HomeConfig>());
    }, [firestore]);
    const { data: homeConfig, isLoading: isConfigLoading } = useDoc(configRef);

    const sectionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>()),
            orderBy('order', 'asc')
        );
    }, [firestore]);

    const { data: allSections, isLoading: isSectionsLoading } = useCollection(sectionsQuery);

    const sections = useMemo(() => {
        if (!allSections) return [];
        return allSections.filter(s => s.isActive);
    }, [allSections]);

    // FALLBACKS
    const defaultHero = {
        title: "Estuclub: Tu Mundo Universitario",
        subtitle: "Beneficios exclusivos, delivery pro y la mejor comunidad.",
        ctaText: "Explorar Ahora",
        ctaLink: "/delivery",
        imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80"
    };

    if (isConfigLoading || isSectionsLoading) {
        return <HomeSectionsSkeleton />;
    }

    return (
        <div className="pb-12 animate-in fade-in duration-1000 space-y-12">
            {/* HERO SECTION with Fallback */}
            <HomeHero hero={homeConfig?.hero || defaultHero} />

            {/* BANNERS SECTION - Only if active banners exist */}
            {homeConfig?.banners && homeConfig.banners.some(b => b.isActive) && (
                <div className="px-4">
                    <BannersCarousel 
                        items={homeConfig.banners.filter(b => b.isActive).map(b => ({
                            id: b.id,
                            title: b.title,
                            image: b.image,
                            imageUrl: b.image,
                            link: b.link,
                            isActive: true,
                            createdAt: Timestamp.now()
                        }))} 
                    />
                </div>
            )}

            {sections.length === 0 && !homeConfig && (
                <EmptyState icon={LayoutTemplate} title="Página en construcción" description="El administrador todavía no ha añadido contenido a la página de inicio." />
            )}

            <div className="space-y-12 px-4">
                {sections.map((section) => {
                    // Visibility Toggles from HomeConfig (Global overrides)
                    const isVisible = 
                        section.id === 'riders_promo' ? (homeConfig?.visibility?.showRiders ?? true) :
                        section.id === 'benefits_grid' ? (homeConfig?.visibility?.showBenefits ?? true) :
                        section.id === 'delivery_carousel' ? (homeConfig?.visibility?.showDelivery ?? true) :
                        section.id === 'cinco_dos' ? (homeConfig?.visibility?.showCincoDos ?? true) :
                        true;

                    if (!isVisible) return null;

                    return (
                        <section key={section.id} className="space-y-6">
                            {section.title && (
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-[0.4em] text-foreground/40">
                                        {section.title}
                                    </h2>
                                </div>
                            )}
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <HomeSectionRenderer section={section} />
                            </div>
                        </section>
                    );
                })}
            </div>
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
            <div className="mx-auto w-full pt-4">
                <div className="px-4 mb-4 flex justify-between items-center">
                    <WelcomeMessage />
                    <ModeToggle />
                </div>
                <Suspense fallback={<HomeSectionsSkeleton />}>
                    <HomeContent />
                </Suspense>
                <AvatarOnboarding />
            </div>
        </MainLayout>
    );
}

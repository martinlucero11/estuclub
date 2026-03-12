import { ArrowRight, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/main-layout';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs, doc, documentId, getDoc } from 'firebase/firestore';
import { firestore } from '@/firebase/server-config';
import { EmptyState } from '@/components/ui/empty-state';
import WelcomeMessage from '@/components/home/welcome-message';
import { HomeSection, Benefit, SupplierProfile, Announcement, Banner } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';

import { BenefitsCarousel, SuppliersCarousel, AnnouncementsCarousel, BannersCarousel } from '@/components/home/carousels';
import { CategoryGrid } from '@/components/home/category-grid';
import { SingleBanner } from '@/components/home/single-banner';
import { BenefitsGrid, SuppliersGrid, AnnouncementsGrid } from '@/components/home/grids';
import { makeBenefitSerializable } from '@/lib/data';

async function getHomeSections() {
    const sectionsRef = collection(firestore, 'home_sections').withConverter(createConverter<HomeSection>());
    const q = query(sectionsRef, where('isActive', '==', true), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data());
}

async function getSectionData(section: HomeSection) {
    const { block } = section;

    if (block.kind === 'categories' || block.kind === 'banner') {
        return null; // No extra data needed
    }

    const { contentType, mode, items: itemIds = [], query: queryConfig } = block;

    const collectionName = contentType === 'suppliers' ? 'roles_supplier' : contentType;
    const itemsCollection = collection(firestore, collectionName);

    if (mode === 'manual') {
        if (!itemIds || itemIds.length === 0) return [];
        const manualQuery = query(itemsCollection, where(documentId(), 'in', itemIds.slice(0, 30)));
        const snapshot = await getDocs(manualQuery);
        const fetchedItems = snapshot.docs.map(d => ({...d.data(), id: d.id}));
        // Re-order based on the original itemIds array
        const orderMap = new Map(itemIds.map((id, index) => [id, index]));
        return fetchedItems.sort((a, b) => (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity));
    }

    // Auto mode
    const constraints = [];
    if (contentType === 'benefits' || contentType === 'suppliers') {
        constraints.push(where('isVisible', '==', true));
    }
    if (contentType === 'announcements') {
        constraints.push(where('status', '==', 'approved'));
    }
    if (contentType === 'banners') {
        constraints.push(where('isActive', '==', true));
    }

    queryConfig?.filters?.forEach(f => {
        if (f.field && f.op && f.value !== undefined) {
            constraints.push(where(f.field, f.op, f.value));
        }
    });

    if (queryConfig?.sort?.field) {
        constraints.push(orderBy(queryConfig.sort.field, queryConfig.sort.direction || 'desc'));
    } else if (contentType !== 'banners') {
        constraints.push(orderBy('createdAt', 'desc'));
    }

    if (queryConfig?.limit) {
        constraints.push(limit(queryConfig.limit));
    }

    const autoQuery = query(itemsCollection, ...constraints);
    const snapshot = await getDocs(autoQuery);
    return snapshot.docs.map(d => ({...d.data(), id: d.id}));
}

export default async function HomePage() {
    const sections = await getHomeSections();

    return (
        <MainLayout>
            <div className="mx-auto w-full px-4">
                <WelcomeMessage />
                <div className="space-y-1 pb-8 pt-2">
                    {sections && sections.length > 0 ? (
                        await Promise.all(sections.map(async (section) => {
                            const items = await getSectionData(section);
                            const { block } = section;

                            if (!block) return null;

                            const { title } = section;
                            let Component;
                            let props: any = { title, ...block };
                            let linkPath: string | undefined;

                            switch (block.kind) {
                                case 'categories':
                                    const categoriesSnapshot = await getDocs(query(collection(firestore, 'categories').withConverter(createConverter<any>()), orderBy('name', 'asc')));
                                    const categories = categoriesSnapshot.docs.map(d => d.data());
                                    Component = CategoryGrid;
                                    props.categories = categories;
                                    break;
                                case 'banner':
                                    const bannerRef = doc(firestore, 'banners', block.bannerId).withConverter(createConverter<any>());
                                    const bannerSnap = await getDoc(bannerRef);
                                    Component = SingleBanner;
                                    props.banner = bannerSnap.exists() ? bannerSnap.data() : null;
                                    break;
                                case 'carousel':
                                    if ('contentType' in block) {
                                        if (block.contentType === 'benefits') Component = BenefitsCarousel;
                                        if (block.contentType === 'suppliers') Component = SuppliersCarousel;
                                        if (block.contentType === 'announcements') Component = AnnouncementsCarousel;
                                        if (block.contentType === 'banners') Component = BannersCarousel;

                                        linkPath = `/${block.contentType === 'suppliers' ? 'proveedores' : block.contentType}`;
                                        if (block.contentType === 'banners') linkPath = undefined;
                                        props.items = items;
                                    }
                                    break;
                                case 'grid':
                                    if ('contentType' in block) {
                                        if (block.contentType === 'benefits') Component = BenefitsGrid;
                                        if (block.contentType === 'suppliers') Component = SuppliersGrid;
                                        if (block.contentType === 'announcements') Component = AnnouncementsGrid;

                                        linkPath = `/${block.contentType === 'suppliers' ? 'proveedores' : block.contentType}`;
                                        props.items = items;
                                    }
                                    break;
                                default:
                                    return null;
                            }

                            if (!Component) return null;
                            if ((block.kind === 'carousel' || block.kind === 'grid') && !props.items) return null;
                            if (block.kind === 'banner' && !props.banner) return null;

                            return (
                                <section key={section.id} className="space-y-1">
                                    {section.title && (
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-base font-bold tracking-tight text-foreground">{section.title}</h2>
                                            {linkPath && (
                                                <Button variant="link" asChild className="text-sm font-semibold text-primary hover:text-primary/80">
                                                    <Link href={linkPath}>
                                                        Ver todos <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <Component {...props} />
                                    </div>
                                </section>
                            );
                        }))
                    ) : (
                        <div>
                            <EmptyState icon={LayoutTemplate} title="Página en construcción" description="El administrador todavía no ha añadido contenido a la página de inicio." />
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

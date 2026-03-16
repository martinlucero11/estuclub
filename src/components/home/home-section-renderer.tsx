
'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useDocOnce, useCollectionOnce } from '@/firebase';
import { collection, query, where, orderBy, doc, limit as firestoreLimit, DocumentData, Query } from 'firebase/firestore';
import { HomeSection, Benefit, SupplierProfile, Announcement, Banner, Category } from '@/types/data';
import { createConverter } from '@/lib/firestore-converter';
import { makeBenefitSerializable } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

import { BenefitsCarousel, SuppliersCarousel, AnnouncementsCarousel, BannersCarousel } from '@/components/home/carousels';
import { CategoryGrid } from '@/components/home/category-grid';
import { SingleBanner } from '@/components/home/single-banner';
import { BenefitsGrid, SuppliersGrid, AnnouncementsGrid } from '@/components/home/grids';

const SectionSkeleton = () => <Skeleton className="h-48 w-full" />;

function useDocumentsByIds<T extends { id: string }>(collectionName: string, ids: string[]) {
    const firestore = useFirestore();
    const queryForIds = useMemo(() => {
        if (!firestore || ids.length === 0) return null;
        // Firestore 'in' query is limited to 30 documents
        return query(
            collection(firestore, collectionName).withConverter(createConverter<T>()),
            where('__name__', 'in', ids.slice(0, 30))
        );
    }, [firestore, collectionName, JSON.stringify(ids)]);

    const { data, isLoading, error } = useCollectionOnce(queryForIds);

    const orderedData = useMemo(() => {
        if (!data) return [];
        const dataMap = new Map(data.map(item => [item.id, item]));
        return ids.map(id => dataMap.get(id)).filter((item): item is T => !!item);
    }, [data, ids]);

    return { data: orderedData, isLoading, error };
}

function SectionContent({ section }: { section: HomeSection }) {
    const { block } = section;
    const firestore = useFirestore();

    if (block.kind === 'categories') {
        const categoriesQuery = useMemo(() => {
            if (!firestore) return null;
            return query(collection(firestore, 'categories').withConverter(createConverter<Category>()), orderBy('name', 'asc'));
        }, [firestore]);
        const { data: categories, isLoading } = useCollectionOnce(categoriesQuery);

        if (isLoading) return <SectionSkeleton />;
        return <CategoryGrid categories={categories || []} />;
    }

    if (block.kind === 'banner') {
        const bannerRef = useMemo(() => {
            if (!firestore) return null;
            return doc(firestore, 'banners', block.bannerId).withConverter(createConverter<Banner>());
        }, [firestore, block.bannerId]);
        const { data: banner, isLoading } = useDocOnce(bannerRef);

        if (isLoading) return <SectionSkeleton />;
        return <SingleBanner banner={banner} />;
    }

    // Dynamic content (carousel/grid)
    const collectionName = block.contentType === 'suppliers' ? 'roles_supplier' : block.contentType;
    let items, isLoading;

    if (block.mode === 'manual') {
        const { data: manualItems, isLoading: manualLoading } = useDocumentsByIds(collectionName, block.items || []);
        items = manualItems;
        isLoading = manualLoading;
    } else { // Auto mode
        const autoQuery = useMemo(() => {
            if (!firestore) return null;
            let q: Query<DocumentData> = query(collection(firestore, collectionName));

            block.query?.filters?.forEach(f => {
                if (f.field && f.op && f.value !== undefined) {
                    q = query(q, where(f.field, f.op, f.value));
                }
            });

            if (block.query?.sort?.field) {
                q = query(q, orderBy(block.query.sort.field, block.query.sort.direction || 'desc'));
            } else {
                // Ensure there is always a default sort order. Most collections have `createdAt`.
                q = query(q, orderBy('createdAt', 'desc'));
            }

            if (block.query?.limit) {
                q = query(q, firestoreLimit(block.query.limit));
            }
            return q;
        }, [firestore, block, collectionName]);

        const { data: autoItems, isLoading: autoLoading } = useCollectionOnce(autoQuery);
        items = autoItems;
        isLoading = autoLoading;
    }

    if (isLoading) return <SectionSkeleton />;
    if (!items || items.length === 0) return null;

    let Component;
    const props: any = { items: [] };

    if (block.kind === 'carousel') {
        props.items = block.contentType === 'benefits' ? (items as Benefit[]).map(makeBenefitSerializable) : items;
        if (block.contentType === 'benefits') Component = BenefitsCarousel;
        if (block.contentType === 'suppliers') Component = SuppliersCarousel;
        if (block.contentType === 'announcements') Component = AnnouncementsCarousel;
        if (block.contentType === 'banners') Component = BannersCarousel;
    } else if (block.kind === 'grid') {
        if (block.contentType === 'benefits') {
            Component = BenefitsGrid;
            props.items = (items as Benefit[]).map(makeBenefitSerializable);
        } else {
            Component = block.contentType === 'suppliers' ? SuppliersGrid : AnnouncementsGrid;
            props.items = items;
        }
    }

    if (!Component) return null;

    return <Component {...props} />;
}

export default function HomeSectionRenderer({ section }: { section: HomeSection }) {
    return <SectionContent section={section} />;
}

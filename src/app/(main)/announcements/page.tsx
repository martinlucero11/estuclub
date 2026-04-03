
'use client';

import MainLayout from '@/components/layout/main-layout';
import AnnouncementsList from '@/components/announcements/announcements-list';
import { BrandSkeleton } from '@/components/ui/brand-skeleton';
import { useCollection, useFirestore } from '@/firebase';
import { collection, orderBy, query, limit } from 'firebase/firestore';
import { Suspense, useMemo } from 'react';
import type { Announcement } from '@/types/data';
import { makeAnnouncementSerializable } from '@/lib/data';
import { PageHeader } from '@/components/ui/page-header';
import { createConverter } from '@/lib/firestore-converter';


function AnnouncementsListSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <BrandSkeleton className="h-48 w-full rounded-2xl" />
                    <div className="space-y-2">
                        <BrandSkeleton className="h-6 w-3/4" />
                        <BrandSkeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function Announcements() {
    const firestore = useFirestore();
    const announcementsQuery = useMemo(
        () => {
            if (!firestore) return null;
            return query(collection(firestore, 'announcements').withConverter(createConverter<Announcement>()), orderBy('createdAt', 'desc'), limit(30))
        },
        [firestore]
    );

    const { data, isLoading } = useCollection(announcementsQuery);

    const announcements = useMemo(() => {
        if (!data) return [];
        return data.map(makeAnnouncementSerializable);
    }, [data]);

    if (isLoading) {
        return <AnnouncementsListSkeleton />;
    }

    return <AnnouncementsList announcements={announcements} />;
}

export default function AnnouncementsPage() {
    return (
        <MainLayout>
            <div className="flex-1 space-y-8 p-4 md:p-8">
                <PageHeader title="Todos los Anuncios" />
                <p className="text-foreground -mt-8 mb-8">
                    Mantente al día con las últimas noticias y publicaciones de la comunidad.
                </p>

                <Suspense fallback={<AnnouncementsListSkeleton />}>
                    <Announcements />
                </Suspense>
            </div>
        </MainLayout>
    );
}


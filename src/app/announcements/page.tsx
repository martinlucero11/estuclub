
'use client';

import MainLayout from '@/components/layout/main-layout';
import AnnouncementsList from '@/components/announcements/announcements-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, Timestamp } from 'firebase/firestore';
import { Suspense, useMemo } from 'react';
import { Megaphone } from 'lucide-react';
import type { Announcement, SerializableAnnouncement } from '@/lib/data';
import { makeAnnouncementSerializable } from '@/lib/data';


function AnnouncementsListSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function Announcements() {
    const firestore = useFirestore();
    const announcementsQuery = useMemoFirebase(
        () => query(collection(firestore, 'announcements'), orderBy('createdAt', 'desc')),
        [firestore]
    );

    const { data, isLoading } = useCollection<Announcement>(announcementsQuery);

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
                <header className="space-y-2">
                     <div className="flex items-center gap-3">
                        <Megaphone className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                            Todos los Anuncios
                        </h1>
                    </div>
                    <p className="text-muted-foreground">
                        Mantente al día con las últimas noticias y publicaciones de la comunidad.
                    </p>
                </header>

                <Suspense fallback={<AnnouncementsListSkeleton />}>
                    <Announcements />
                </Suspense>
            </div>
        </MainLayout>
    );
}

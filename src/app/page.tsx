
'use client';

import MainLayout from '@/components/layout/main-layout';
import WelcomeMessage from '@/components/home/welcome-message';
import AnnouncementsList from '@/components/announcements/announcements-list';
import { Suspense, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Perk } from '@/lib/data';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import PerksCarousel from '@/components/perks/perks-carousel';


// Define serializable types for client components
type SerializableTimestamp = { toDate: () => Date };
interface SerializableAnnouncement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorUsername: string;
  createdAt: string; // Changed to string
  imageUrl?: string;
  linkUrl?: string;
}

interface SerializablePerk extends Omit<Perk, 'createdAt' | 'validUntil'> {
  createdAt?: string; // Changed to string
  validUntil?: string; // Changed to string
}


export type CarouselItemType = (SerializablePerk & { type: 'perk' }) | (SerializableAnnouncement & { type: 'announcement' });

// Function to safely convert Timestamp to ISO string
function toISOString(timestamp?: SerializableTimestamp | Timestamp): string | undefined {
    if (!timestamp) return undefined;
    return timestamp.toDate().toISOString();
}

function HomePageContent() {
    const firestore = useFirestore();

    const perksQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'benefits'),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
    }, [firestore]);

    const announcementsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'announcements'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
    }, [firestore]);

    const { data: perksData, isLoading: perksLoading } = useCollection<Perk>(perksQuery);
    const { data: announcementsData, isLoading: announcementsLoading } = useCollection<any>(announcementsQuery);

    const carouselItems = useMemo(() => {
        if (!perksData || !announcementsData) return [];
        
        const perks: CarouselItemType[] = perksData.map(doc => ({
            ...doc,
            type: 'perk' as const,
            createdAt: toISOString(doc.createdAt),
            validUntil: toISOString(doc.validUntil),
        }));

        const announcements: CarouselItemType[] = announcementsData.map(doc => ({
            ...doc,
            type: 'announcement' as const,
            createdAt: toISOString(doc.createdAt),
        }));

        const combined = [...perks, ...announcements];
        combined.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return combined;
    }, [perksData, announcementsData]);
    
    const serializableAnnouncements = useMemo(() => {
        if (!announcementsData) return [];
        return announcementsData.map(doc => ({
            ...doc,
            createdAt: toISOString(doc.createdAt),
        })) as SerializableAnnouncement[];
    }, [announcementsData]);

    return (
        <>
            <div className="space-y-4">
                <div className='flex items-center justify-between'>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Beneficios Destacados
                  </h2>
                </div>
                {perksLoading ? <PerksCarouselSkeleton/> : <PerksCarousel carouselItems={carouselItems} /> }
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Últimos Anuncios
              </h2>
               <Suspense fallback={<AnnouncementsListSkeleton />}>
                    {announcementsLoading ? <AnnouncementsListSkeleton /> : <AnnouncementsList announcements={serializableAnnouncements} />}
                </Suspense>
            </div>
        </>
    );
}

function PerksCarouselSkeleton() {
    return (
        <div className="relative w-full overflow-hidden">
            <div className="flex">
                <div className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 p-2 h-48">
                     <div className="space-y-4 h-full">
                        <Skeleton className="h-full w-full" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function AnnouncementsListSkeleton() {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        {[...Array(3)].map((_, i) => (
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


export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="flex-1 space-y-8 p-4 md:p-8">
        <header className="space-y-2">
            <WelcomeMessage />
        </header>
        <HomePageContent />
      </div>
    </MainLayout>
  );
}

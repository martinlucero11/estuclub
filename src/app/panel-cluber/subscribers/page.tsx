'use client';

import { useUser, useFirestore, useCollection, useCollectionOnce } from '@/firebase';
import { collection, query, where, documentId, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import BackButton from '@/components/layout/back-button';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Users, Calendar } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { createConverter } from '@/lib/firestore-converter';

interface Subscriber {
    id: string; // This is the userId
    subscribedAt: Timestamp;
}

interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoURL?: string;
}

// Combined type
type EnrichedSubscriber = UserProfile & {
    subscribedAt: Timestamp;
};

// Component to render the list
function SubscriberList() {
    const { user } = useUser();
    const firestore = useFirestore();

    // 1. Fetch the list of subscriber documents (which contain just subscribedAt)
    const subscribersQuery = useMemo(() => {
        if (!user) return null;
        return query(collection(firestore, 'roles_supplier', user.uid, 'subscribers').withConverter(createConverter<Subscriber>()));
    }, [user, firestore]);
    
    const { data: subscribers, isLoading: isLoadingSubscribers } = useCollection(subscribersQuery);

    // 2. Get just the IDs
    const subscriberIds = useMemo(() => subscribers?.map(sub => sub.id) || [], [subscribers]);

    // 3. Fetch the user profiles for those IDs
    const usersQuery = useMemo(() => {
        if (!firestore || subscriberIds.length === 0) return null;
        // Firestore 'in' queries are limited to 30 items. For this version, we'll fetch up to 30.
        return query(
            collection(firestore, 'users').withConverter(createConverter<UserProfile>()), 
            where(documentId(), 'in', subscriberIds.slice(0, 30))
        );
    }, [firestore, subscriberIds]);

    const { data: userProfiles, isLoading: isLoadingUsers } = useCollectionOnce(usersQuery);
    
    // 4. Combine the data
    const enrichedSubscribers = useMemo((): EnrichedSubscriber[] => {
        if (!subscribers || !userProfiles) return [];
        const profilesMap = new Map(userProfiles.map(p => [p.id, p]));
        return subscribers
            .map(sub => {
                const profile = profilesMap.get(sub.id);
                if (!profile) return null;
                return {
                    ...profile,
                    subscribedAt: sub.subscribedAt
                };
            })
            .filter((s): s is EnrichedSubscriber => s !== null)
            .sort((a, b) => b.subscribedAt.toMillis() - a.subscribedAt.toMillis());

    }, [subscribers, userProfiles]);

    const isLoading = isLoadingSubscribers || (subscriberIds.length > 0 && isLoadingUsers);

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Card key={i} className="p-4"><Skeleton className="h-10 w-full" /></Card>
                ))}
            </div>
        );
    }
    
    if (enrichedSubscribers.length === 0) {
        return (
            <EmptyState
                icon={Users}
                title="Aún no tienes suscriptores"
                description="Cuando los usuarios se suscriban a tu perfil, aparecerán aquí."
            />
        );
    }

    return (
        <div className="space-y-3">
            {enrichedSubscribers.map(sub => {
                 const initials = getInitials(`${sub.firstName} ${sub.lastName}`);
                 const subscribedDate = sub.subscribedAt.toDate();
                return (
                    <Card key={sub.id} className="p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={sub.photoURL} alt={`${sub.firstName} ${sub.lastName}`} />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{`${sub.firstName} ${sub.lastName}`}</p>
                                    <p className="text-sm text-muted-foreground">{sub.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Suscrito el {subscribedDate.toLocaleDateString('es-ES')}</span>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    );
}


// The page itself
export default function SubscribersPage() {
    return (
        <div className="space-y-4">
            <BackButton />
            <h1 className="text-3xl font-bold">Mis Suscriptores</h1>
            <p className="text-muted-foreground">
                Estos son los usuarios que recibirán notificaciones sobre tus nuevos beneficios.
            </p>
            <SubscriberList />
        </div>
    );
}

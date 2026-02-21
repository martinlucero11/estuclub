'use client';

import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
    firstName: string;
}

export default function WelcomeMessage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const getGreeting = () => {
        if (!userProfile) return "Bienvenido a EstuClub";
        return `Hola, ${userProfile.firstName} 👋`;
    };
    
    const isLoading = isUserLoading || (user && isProfileLoading);

    if (isLoading) {
        return (
             <div className="mb-4 mt-4 px-4 space-y-2">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
            </div>
        );
    }

    if (!user || !userProfile) {
        return (
            <div className="mb-4 mt-4 px-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                    Bienvenido a EstuClub
                </h1>
                <p className="text-muted-foreground font-medium mt-1">
                    Inicia sesión para descubrir beneficios exclusivos.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-4 mt-4 px-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                {getGreeting()}
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
                ¿Qué beneficio vas a disfrutar hoy?
            </p>
        </div>
    );
}

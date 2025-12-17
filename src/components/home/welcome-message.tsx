
'use client';

import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
    firstName: string;
    gender: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decirlo';
}

export default function WelcomeMessage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    const getGreeting = () => {
        if (!userProfile) return "Bienvenido a EstuClub";
        switch (userProfile.gender) {
            case 'Femenino':
                return `Bienvenida, ${userProfile.firstName}`;
            case 'Masculino':
                return `Bienvenido, ${userProfile.firstName}`;
            case 'Otro':
            case 'Prefiero no decirlo':
                return `Bienvenidx, ${userProfile.firstName}`;
            default:
                return `Bienvenid@, ${userProfile.firstName}`;
        }
    };

    if (isUserLoading || (user && isProfileLoading)) {
        return <Skeleton className="h-10 w-3/4" />;
    }

    if (!user || !userProfile) {
        return (
            <>
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    Bienvenido a EstuClub
                </h1>
                <p className="text-muted-foreground">
                    Inicia sesión para descubrir beneficios exclusivos.
                </p>
            </>
        );
    }

    return (
        <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {getGreeting()}
            </h1>
            <p className="text-muted-foreground">
                Descubre beneficios exclusivos, eventos y más, solo para ti.
            </p>
        </>
    );
}

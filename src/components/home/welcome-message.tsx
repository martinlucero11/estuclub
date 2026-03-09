'use client';

import { useUser } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

const WelcomeMessage = () => {
    const { user, isUserLoading } = useUser();
    
    if (isUserLoading) {
        return (
            <div className="px-4 py-6 space-y-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-5 w-64" />
            </div>
        )
    }

    const displayName = user?.displayName?.split(' ')[0] || "Bienvenido";

    return (
        <div className="px-4 py-6">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                Hola, {displayName} 👋
            </h1>
            <p className="text-muted-foreground font-semibold text-base mt-1">
                Descubre los mejores beneficios cerca de ti.
            </p>
        </div>
    );
};

export default WelcomeMessage;

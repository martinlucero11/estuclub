'use client';

import { useUser } from '@/firebase';
import { Skeleton } from '../ui/skeleton';

const WelcomeMessage = () => {
    const { user, isUserLoading } = useUser();
    
    if (isUserLoading) {
        return (
            <div className="py-4 space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-56" />
            </div>
        )
    }

    const displayName = user?.displayName?.split(' ')[0] || "Bienvenido";

    return (
        <div className="py-4">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Hola, {displayName} 👋
            </h1>
            <p className="text-muted-foreground font-semibold text-sm mt-1">
                Descubre los mejores beneficios cerca de ti.
            </p>
        </div>
    );
};

export default WelcomeMessage;

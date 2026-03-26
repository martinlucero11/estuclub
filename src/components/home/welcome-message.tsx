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
        <div className="py-6 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Hola, <span className="text-primary">{displayName}</span> 👋
            </h1>
            <p className="text-muted-foreground font-medium text-base md:text-lg mt-1">
                Descubre los beneficios exclusivos que tenemos para vos.
            </p>
        </div>
    );
};

export default WelcomeMessage;

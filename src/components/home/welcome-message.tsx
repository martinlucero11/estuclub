'use client';

import { useUser } from '@/firebase';
import { Skeleton } from '../ui/skeleton';
import { usePathname } from 'next/navigation';

const WelcomeMessage = () => {
    const { user, userData, isUserLoading } = useUser();
    const pathname = usePathname();
    
    if (isUserLoading) {
        return (
            <div className="py-4 space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-56" />
            </div>
        )
    }

    const isDeliveryPage = pathname.startsWith('/delivery');
    const isStudent = userData?.isStudent || false;
    const isShowingDelivery = isDeliveryPage || !isStudent;

    const displayName = user?.displayName?.split(' ')[0] || "Bienvenido";

    return (
        <div className="py-2 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Hola, <span className="text-primary">{displayName}</span> 👋
            </h1>
            <p className="text-foreground font-medium text-base md:text-lg mt-1">
                {isShowingDelivery 
                    ? "Encuentra lo que necesites y recíbelo en tu puerta."
                    : "Descubre los beneficios exclusivos que tenemos para vos."}
            </p>
        </div>
    );
};

export default WelcomeMessage;


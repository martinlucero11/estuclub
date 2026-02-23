'use client';

import { useFirebase } from '@/firebase/provider';

const WelcomeMessage = () => {
    // FIX: Using the correct hook `useFirebase` to get the auth instance
    const { auth } = useFirebase();
    const user = auth?.currentUser;

    // Fallback logic for display name remains the same
    const displayName = user?.displayName?.split(' ')[0] || "Melanie";

    return (
        <div className="px-4 py-6 mb-4">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Hola, {displayName} 👋
            </h1>
            <p className="text-muted-foreground font-medium mt-1">
                Descubre los mejores beneficios cerca de ti.
            </p>
        </div>
    );
};

export default WelcomeMessage;

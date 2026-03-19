'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { getMessaging, onMessage } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

const MessagingContext = createContext<undefined>(undefined);

export const useMessaging = () => {
    const context = useContext(MessagingContext);
    if (context === undefined) {
        throw new Error('useMessaging must be used within a MessagingProvider');
    }
    return context;
};

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
    const { firebaseApp } = useFirebase();
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && firebaseApp) {
            const messaging = getMessaging(firebaseApp);

            // Handle messages when app is in foreground
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Message received in foreground. ', payload);
                toast({
                    title: payload.notification?.title,
                    description: payload.notification?.body,
                });
            });

            return () => unsubscribe();
        }
    }, [firebaseApp, toast]);

    return (
        <MessagingContext.Provider value={undefined}>
            {children}
        </MessagingContext.Provider>
    );
};

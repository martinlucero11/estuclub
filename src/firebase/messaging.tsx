'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { isSupported } from 'firebase/messaging';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { onMessageListener } from '@/lib/fcm';

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
        const setupMessaging = async () => {
            try {
                if (typeof window !== 'undefined' && firebaseApp) {
                    const supported = await isSupported();
                    if (!supported) return;

                    // Unified listener for both Web and Native
                    const unsubscribe = await onMessageListener((payload) => {
                        // Message received in foreground.
                        
                        const title = payload.notification?.title || payload.title;
                        const body = payload.notification?.body || payload.body;

                        toast({
                            title: title,
                            description: body,
                        });
                    });

                    return unsubscribe;
                }
            } catch (error) {
                console.error('Error initializing Firebase Messaging:', error);
            }
        };

        const cleanup = setupMessaging();
        
        return () => {
            cleanup.then(unsub => {
                if (typeof unsub === 'function') {
                    unsub();
                }
            });
        };
    }, [firebaseApp, toast]);

    return (
        <MessagingContext.Provider value={undefined}>
            {children}
        </MessagingContext.Provider>
    );
};


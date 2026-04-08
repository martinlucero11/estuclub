'use client';

import { createContext, useContext, useEffect, ReactNode, useRef, useState } from 'react';
import { isSupported } from 'firebase/messaging';
import { useFirebase, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { onMessageListener, requestNotificationPermission } from '@/lib/fcm';
import { doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export interface MessagingContextType {
    fcmToken: string | null;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
    const context = useContext(MessagingContext);
    if (context === undefined) {
        throw new Error('useMessaging must be used within a MessagingProvider');
    }
    return context;
};

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
    const { firebaseApp, firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const hasRegisteredRef = useRef(false);

    useEffect(() => {
        const setupMessaging = async () => {
            try {
                if (typeof window !== 'undefined' && firebaseApp && user && !hasRegisteredRef.current) {
                    const supported = await isSupported();
                    if (!supported) return;

                    // 1. Request Permission & Get Token
                    const token = await requestNotificationPermission();
                    
                    if (token) {
                        setFcmToken(token);
                        // 2. Save Token to Firestore (associated with user)
                        const tokenRef = doc(firestore, 'userTokens', user.uid);
                        await setDoc(tokenRef, {
                            tokens: arrayUnion(token),
                            lastUpdated: serverTimestamp(),
                            platform: 'web'
                        }, { merge: true });
                        
                        hasRegisteredRef.current = true;
                    }

                    // 3. Unified listener for both Web and Native
                    const unsubscribe = await onMessageListener((payload) => {
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
    }, [firebaseApp, firestore, user, toast]);

    return (
        <MessagingContext.Provider value={{ fcmToken }}>
            {children}
        </MessagingContext.Provider>
    );
};



'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirebase } from './provider';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';

const MessagingContext = createContext<undefined>(undefined);

export const useMessaging = () => {
    const context = useContext(MessagingContext);
    if (context === undefined) {
        throw new Error('useMessaging must be used within a MessagingProvider');
    }
    return context;
};

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
    const { firebaseApp, user, firestore } = useFirebase();
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined' && firebaseApp) {
            const messaging = getMessaging(firebaseApp);

            // Handle messages when app is in foreground
            onMessage(messaging, (payload) => {
                console.log('Message received. ', payload);
                toast({
                    title: payload.notification?.title,
                    description: payload.notification?.body,
                });
            });

            // Function to request permission and get token
            const requestPermission = async () => {
                if (!user || !firestore) return;

                try {
                    const permission = await Notification.requestPermission();
                    if (permission === 'granted') {
                        console.log('Notification permission granted.');
                        
                        // Get token
                        const currentToken = await getToken(messaging, {
                            vapidKey: 'YOUR_VAPID_KEY_HERE', // IMPORTANT: Replace with your VAPID key from Firebase Console
                        });

                        if (currentToken) {
                            console.log('FCM Token:', currentToken);
                            // Save the token to Firestore
                            const tokenRef = doc(firestore, 'userTokens', user.uid);
                            await setDoc(tokenRef, { token: currentToken }, { merge: true });
                        } else {
                            console.log('No registration token available. Request permission to generate one.');
                        }
                    } else {
                        console.log('Unable to get permission to notify.');
                    }
                } catch (err) {
                    console.error('An error occurred while retrieving token. ', err);
                }
            };
            
            // Request permission when user logs in
            if (user) {
                requestPermission();
            }
        }
    }, [firebaseApp, user, firestore, toast]);

    return (
        <MessagingContext.Provider value={undefined}>
            {children}
        </MessagingContext.Provider>
    );
};

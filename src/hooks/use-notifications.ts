'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useFirebaseApp } from '@/firebase';
import { doc, setDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';

const VAPID_KEY = 'BFp8_dzQcHkXTre2tT6YT85zBrFz0xoB7QCRXmfVbsTOOW9IMClQSueOt2yeLpSuWMWKABJVfredoC-cFM58ULE';

/**
 * useNotifications Hook
 * Misión 1: Gestión de permisos y tokens de FCM.
 */
export function useNotifications() {
    const { user } = useUser();
    const firestore = useFirestore();
    const app = useFirebaseApp();
    const { toast } = useToast();
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        setPermission(Notification.permission);
    }, []);

    const requestPermission = async () => {
        if (!user || !firestore || !app || typeof window === 'undefined') return;

        try {
            const supported = await isSupported();
            if (!supported) return;

            const status = await Notification.requestPermission();
            setPermission(status);

            if (status === 'granted') {
                const messaging = getMessaging(app);
                const token = await getToken(messaging, { vapidKey: VAPID_KEY });

                if (token) {
                    console.log('FCM Token:', token);
                    // Guardar token en Firestore (SSoT para notificaciones)
                    const tokenRef = doc(firestore, 'userTokens', user.uid);
                    await setDoc(tokenRef, {
                        tokens: arrayUnion(token),
                        lastUpdated: Timestamp.now(),
                        platform: 'web'
                    }, { merge: true });
                }
            }
        } catch (error) {
            console.error('Error in FCM permission/token:', error);
        }
    };

    // Escuchar mensajes en primer plano (Foreground)
    useEffect(() => {
        if (!app || typeof window === 'undefined') return;
        
        const setupListener = async () => {
            const supported = await isSupported();
            if (!supported) return;

            const messaging = getMessaging(app);
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Foreground Message:', payload);
                toast({
                    title: payload.notification?.title || 'Notificación',
                    description: payload.notification?.body || '',
                    variant: 'default',
                    className: 'bg-white border-primary/20 text-black font-bold border-l-4 border-l-primary',
                });
            });

            return unsubscribe;
        };

        const unsubPromise = setupListener();
        return () => {
            unsubPromise.then(unsub => unsub?.());
        };
    }, [app, toast]);

    return { permission, requestPermission };
}

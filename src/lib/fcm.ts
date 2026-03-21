'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/firebase/client-config';
import { isSupported } from 'firebase/messaging';

const VAPID_KEY = 'BFp8_dzQcHkXTre2tT6YT85zBrFz0xoB7QCRXmfVbsTOOW9IMClQSueOt2yeLpSuWMWKABJVfredoC-cFM58ULE';

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return null;
  
  const supported = await isSupported();
  if (!supported) {
      console.log('Messaging not supported in this browser');
      return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Register service worker if not already
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const registration = await navigator.serviceWorker.ready;
      const messaging = getMessaging(app);
      
      // Get FCM token
      const token = await getToken(messaging, { 
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (token) {
        console.log('FCM Token:', token);
        // We could send this token to our server to subscribe to topics
        await fetch('/api/notifications/subscribe', {
            method: 'POST',
            body: JSON.stringify({ token, topic: 'all_benefits' }),
            headers: { 'Content-Type': 'application/json' }
        });
        return token;
      }
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
  return null;
}

export async function onMessageListener() {
    const supported = await isSupported();
    if (!supported) return null;
    
    const messaging = getMessaging(app);
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
}

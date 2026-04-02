'use client';

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '@/firebase/client-config';
import { isSupported as isMessagingSupported } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const VAPID_KEY = 'BFp8_dzQcHkXTre2tT6YT85zBrFz0xoB7QCRXmfVbsTOOW9IMClQSueOt2yeLpSuWMWKABJVfredoC-cFM58ULE';

/**
 * Requests notification permission and returns the FCM token.
 * Handles both Web and Native (Capacitor) platforms.
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return null;

  // --- NATIVE (ANDROID/IOS) ---
  if (Capacitor.isNativePlatform()) {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive === 'granted') {
        // Register with FCM
        await PushNotifications.register();
        
        // Listeners must be set up elsewhere or via a stateful hook
        // For token retrieval, we normally listen to 'registration' event
        return new Promise<string | null>((resolve) => {
          PushNotifications.addListener('registration', (token) => {
            resolve(token.value);
          });
          PushNotifications.addListener('registrationError', (err) => {
            console.error('Push registration error:', err);
            resolve(null);
          });
        });
      }
    } catch (error) {
      console.error('Error requesting native notification permission:', error);
      return null;
    }
  }

  // --- WEB ---
  const supported = await isMessagingSupported();
  if (!supported) {

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
        // Only subscribe to topic in production
        if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
          try {
            await fetch('/api/notifications/subscribe', {
              method: 'POST',
              body: JSON.stringify({ token, topic: 'all_benefits' }),
              headers: { 'Content-Type': 'application/json' }
            });
          } catch {
            // Non-critical
          }
        }
        return token;
      }
    }
  } catch (error) {
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      console.error('Error requesting web notification permission:', error);
    }
  }
  return null;
}

/**
 * Listens for messages in foreground.
 * Handles both Web and Native (Capacitor) platforms.
 * @param callback Function to execute when a message is received.
 * @returns An unsubscribe function.
 */
export async function onMessageListener(callback: (payload: any) => void) {
    if (Capacitor.isNativePlatform()) {
        const handler = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
            callback(notification);
        });
        return () => handler.remove();
    }

    const supported = await isMessagingSupported();
    if (!supported) return () => {};
    
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
        callback(payload);
    });
    
    return unsubscribe;
}

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCcdZGahEhyF6-LCfpuBlFHVt6cFWqDLLQ",
  authDomain: "studio-7814845508-d173f.firebaseapp.com",
  projectId: "studio-7814845508-d173f",
  storageBucket: "studio-7814845508-d173f.firebasestorage.app",
  messagingSenderId: "742876183164",
  appId: "1:742876183164:web:2313c30be9f229479ea7f9",
});

const messaging = firebase.messaging();

// MISSION 2: Background Notification Display
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.png', // Main Estuclub Icon
        badge: '/favicon.png',
        data: {
            url: payload.data?.url || '/' // DEEP LINKING SUPPORT
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// MISSION 2: Deep Linking Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If window already open, focus it and navigate
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If no window, open new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

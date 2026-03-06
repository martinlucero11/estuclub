// This file must be in the public folder.

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase services
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// IMPORTANT: Replace this with your project's web app configuration.
const firebaseConfig = {
    apiKey: "AIzaSyBAW-IVnjtxmCaxi9c_XtgoktXDb24lcik",
    authDomain: "studio-7814845508-d173f.firebaseapp.com",
    projectId: "studio-7814845508-d173f",
    storageBucket: "studio-7814845508-d173f.firebasestorage.app",
    messagingSenderId: "742876183164",
    appId: "1:742876183164:web:2313c30be9f229479ea7f9",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-192.png' // Make sure you have this icon in your public folder
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

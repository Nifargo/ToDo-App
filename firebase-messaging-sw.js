// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxde31tl4RazVOmcC_c14lG2b3wsPXzC0",
  authDomain: "just-do-it-c3390.firebaseapp.com",
  projectId: "just-do-it-c3390",
  storageBucket: "just-do-it-c3390.firebasestorage.app",
  messagingSenderId: "1057242941805",
  appId: "1:1057242941805:web:8caea8fb087210f8637264"
};

// Initialize Firebase in Service Worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Tasks for today';
  const notificationOptions = {
    body: payload.notification?.body || 'You have tasks for today',
    icon: payload.notification?.icon || '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    tag: 'task-notification',
    requireInteraction: false,
    data: {
      url: payload.data?.url || '/',
      ...payload.data
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
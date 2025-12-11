/**
 * Firebase Cloud Messaging Service Worker
 *
 * Handles push notifications when the app is in the background or closed.
 * This file must be in the public directory and served from the root path.
 */

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

// Firebase configuration
// Note: In production, these should match your .env values
// The service worker cannot access import.meta.env, so we use a fallback pattern
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Initialize Firebase in service worker context
// This will gracefully fail if credentials are not valid
try {
  firebase.initializeApp(firebaseConfig);

  // Get Firebase Messaging instance
  const messaging = firebase.messaging();

  /**
   * Handle background push notifications
   *
   * This handler is called when:
   * 1. App is in background
   * 2. App is closed
   * 3. Browser tab is not active
   */
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);

    // Extract notification data
    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: payload.notification?.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'task-notification',
      requireInteraction: false,
      data: {
        url: payload.data?.url || '/',
        ...payload.data,
      },
      actions: [
        {
          action: 'open',
          title: 'Open App',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    };

    // Show notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

  /**
   * Handle notification click events
   */
  self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification clicked:', event);

    event.notification.close();

    // Handle notification click action
    if (event.action === 'dismiss') {
      // User dismissed the notification
      return;
    }

    // Open the app or focus existing window
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }

          // Open new window if app is not open
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  });
} catch (error) {
  console.error('[firebase-messaging-sw.js] Firebase initialization failed:', error);
  console.warn('[firebase-messaging-sw.js] Push notifications will not work without valid Firebase credentials');
}

/**
 * Service Worker installation
 */
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing...');
  // Force activation immediately
  self.skipWaiting();
});

/**
 * Service Worker activation
 */
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  // Take control of all pages immediately
  event.waitUntil(clients.claim());
});
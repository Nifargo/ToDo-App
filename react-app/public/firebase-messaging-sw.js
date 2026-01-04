/**
 * Push Notifications Service Worker
 * 
 * Supports:
 * - Firebase Cloud Messaging (FCM) for Chrome/Firefox/Edge
 * - Standard Web Push API for iOS PWA (16.4+)
 * 
 * This file must be in the public directory and served from the root path.
 */

const BASE_PATH = '/ToDo-App';

// ============================================
// STANDARD WEB PUSH API (iOS PWA Compatible)
// ============================================

/**
 * Handle push events from Web Push API
 * This is the standard way that works on iOS PWA
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let data = {
    title: 'Мої Справи',
    body: 'У тебе є завдання!',
    url: `${BASE_PATH}/`
  };

  // Parse push data
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Push payload:', payload);
      
      // Handle different payload formats (FCM style vs direct)
      if (payload.notification) {
        data.title = payload.notification.title || data.title;
        data.body = payload.notification.body || data.body;
      } else {
        data.title = payload.title || data.title;
        data.body = payload.body || data.body;
      }
      data.url = payload.data?.url || payload.url || data.url;
    } catch (e) {
      console.log('[SW] Push data is text:', event.data.text());
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: `${BASE_PATH}/icons/icon-192.png`,
    badge: `${BASE_PATH}/icons/icon-72.png`,
    vibrate: [200, 100, 200],
    tag: 'todo-notification',
    requireInteraction: false,
    renotify: true,
    data: {
      url: data.url,
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'Відкрити' },
      { action: 'close', title: 'Закрити' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[SW] Notification shown'))
      .catch(err => console.error('[SW] Notification error:', err))
  );
});

/**
 * Handle notification click events
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'close' || event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || `${BASE_PATH}/`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(BASE_PATH) && 'focus' in client) {
            console.log('[SW] Focusing existing window');
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          console.log('[SW] Opening new window:', urlToOpen);
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Handle notification close events
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// ============================================
// FIREBASE CLOUD MESSAGING (Chrome/Firefox)
// ============================================

// Try to initialize Firebase for browsers that support it
// This will fail silently on iOS Safari/PWA
let firebaseInitialized = false;

try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

  const firebaseConfig = {
    apiKey: 'AIzaSyAxde31tl4RazVOmcC_c14lG2b3wsPXzC0',
    authDomain: 'just-do-it-c3390.firebaseapp.com',
    projectId: 'just-do-it-c3390',
    storageBucket: 'just-do-it-c3390.firebasestorage.app',
    messagingSenderId: '1057242941805',
    appId: '1:1057242941805:web:8caea8fb087210f8637264',
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  firebaseInitialized = true;

  console.log('[SW] Firebase Messaging initialized');

  /**
   * Handle background messages from FCM
   * Note: This is for Chrome/Firefox - iOS uses the 'push' event above
   */
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] FCM Background message:', payload);

    // Don't show notification here - the 'push' event handler above will handle it
    // This prevents duplicate notifications on browsers that support both
  });

} catch (error) {
  console.log('[SW] Firebase not available (expected on iOS):', error.message);
  // This is expected on iOS - we use standard Web Push API instead
}

// ============================================
// SERVICE WORKER LIFECYCLE
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing... (Firebase:', firebaseInitialized ? 'Yes' : 'No', ')');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
});

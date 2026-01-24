/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { createHandlerBoundToURL } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

const BASE_PATH = '/ToDo-App';

// ============================================
// WORKBOX CONFIGURATION
// ============================================

self.skipWaiting();
clientsClaim();

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navigation fallback
const navigationHandler = createHandlerBoundToURL(`${BASE_PATH}/index.html`);
const navigationRoute = new NavigationRoute(navigationHandler, {
  denylist: [/^\/firebase-messaging-sw\.js$/, /^\/sw\.js$/],
});
registerRoute(navigationRoute);

// Firebase Storage caching
registerRoute(
  /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'firebase-storage-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
  'GET'
);

// Firebase SDK caching
registerRoute(
  /^https:\/\/www\.gstatic\.com\/firebasejs\/.*/i,
  new CacheFirst({
    cacheName: 'firebase-sdk-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
  'GET'
);

// ============================================
// WEB PUSH NOTIFICATIONS (iOS PWA Compatible)
// ============================================

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    url?: string;
  };
}

/**
 * Handle push events from Web Push API
 * This is the standard way that works on iOS PWA (16.4+)
 */
self.addEventListener('push', (event: PushEvent) => {
  console.log('[SW] Push event received');

  const data = {
    title: 'Мої Справи',
    body: 'У тебе є завдання!',
    url: `${BASE_PATH}/`
  };

  // Parse push data
  if (event.data) {
    try {
      const payload: PushPayload = event.data.json();
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
    } catch {
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
  } as NotificationOptions & { vibrate?: number[]; renotify?: boolean };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[SW] Notification shown'))
      .catch(err => console.error('[SW] Notification error:', err))
  );
});

/**
 * Handle notification click events
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'close' || event.action === 'dismiss') {
    return;
  }

  const urlToOpen = (event.notification.data?.url as string) || `${BASE_PATH}/`;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(BASE_PATH) && 'focus' in client) {
            console.log('[SW] Focusing existing window');
            return client.focus();
          }
        }
        // Open new window if none exists
        if (self.clients.openWindow) {
          console.log('[SW] Opening new window:', urlToOpen);
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Handle notification close events
 */
self.addEventListener('notificationclose', () => {
  console.log('[SW] Notification closed');
});

// ============================================
// SERVICE WORKER LIFECYCLE
// ============================================

self.addEventListener('install', () => {
  console.log('[SW] Installing with push support...');
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated with push support');
  event.waitUntil(self.clients.claim());
});
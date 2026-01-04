/**
 * Push Notifications Service
 * 
 * Supports:
 * - Firebase Cloud Messaging (FCM) for Chrome/Firefox/Edge
 * - Standard Web Push API for iOS PWA (16.4+)
 * 
 * iOS PWA requires:
 * - iOS 16.4 or later
 * - App added to Home Screen (standalone mode)
 * - Permission granted AFTER installation
 */

import { getToken, deleteToken, onMessage, type Messaging } from 'firebase/messaging';
import { doc, setDoc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { messaging, db } from '@/config/firebase';
import type { FCMTokenData } from '@/types/user.types';

// VAPID public key for Web Push
const VAPID_PUBLIC_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 
  'BAx2-XuP9uTBN1yD_kw7s8FyM4yD-vkw1pI93_x0b33hCKWiF6Fmgi0LBaS-IRsuGUIP8PAMtuJiKZnUmfI2UOk';

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
}

/**
 * Check if running as iOS PWA (standalone mode)
 */
export function isIOSPWA(): boolean {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (navigator as unknown as { standalone: boolean }).standalone === true;
  return isIOS() && isStandalone;
}

/**
 * Get iOS version
 */
export function getIOSVersion(): { major: number; minor: number; patch: number } | null {
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
  if (match) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3] || '0', 10)
    };
  }
  return null;
}

/**
 * Check if iOS version supports Web Push (16.4+)
 */
export function isIOSPushSupported(): boolean {
  if (!isIOS()) return true;
  
  const version = getIOSVersion();
  if (!version) return false;
  
  return version.major > 16 || (version.major === 16 && version.minor >= 4);
}

/**
 * Result of push notification setup
 */
export interface PushSetupResult {
  success: boolean;
  token?: string;
  subscription?: PushSubscription;
  error?: Error;
  platform: 'ios-pwa' | 'ios-safari' | 'web' | 'unsupported';
}

/**
 * Options for requesting push notifications
 */
export interface PushNotificationOptions {
  userId?: string;
  saveToFirestore?: boolean;
}

/**
 * Request push notifications - works on both FCM and iOS PWA
 */
export async function requestPushNotifications(options: PushNotificationOptions = {}): Promise<PushSetupResult> {
  const platform = isIOSPWA() ? 'ios-pwa' : (isIOS() ? 'ios-safari' : 'web');
  
  console.log('[Push] Platform:', platform);
  console.log('[Push] iOS version:', getIOSVersion());

  // Check basic support
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return {
      success: false,
      error: new Error('Push notifications not supported'),
      platform: 'unsupported'
    };
  }

  // Check iOS requirements
  if (isIOS()) {
    if (!isIOSPushSupported()) {
      return {
        success: false,
        error: new Error('iOS 16.4+ required for push notifications'),
        platform
      };
    }
    
    if (!isIOSPWA()) {
      return {
        success: false,
        error: new Error('Add to Home Screen to enable notifications on iOS'),
        platform: 'ios-safari'
      };
    }
  }

  // Check permission
  if (Notification.permission === 'denied') {
    return {
      success: false,
      error: new Error('Notifications blocked. Enable in device settings.'),
      platform
    };
  }

  try {
    // Request permission if needed
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          success: false,
          error: new Error('Notification permission not granted'),
          platform
        };
      }
    }

    // For iOS PWA, use standard Web Push API directly
    if (isIOSPWA()) {
      console.log('[Push] Using Web Push API for iOS PWA');
      return await setupWebPushSubscription(options);
    }

    // For other browsers, try FCM first, fall back to Web Push
    if (messaging) {
      console.log('[Push] Using Firebase Cloud Messaging');
      const fcmResult = await setupFCMToken(options);
      
      // Also create Web Push subscription for compatibility
      if (fcmResult.success && options.userId) {
        try {
          await setupWebPushSubscription({ ...options, saveToFirestore: true });
        } catch (e) {
          console.warn('[Push] Web Push subscription failed (FCM will still work):', e);
        }
      }
      
      return fcmResult;
    }

    // Fall back to Web Push only
    console.log('[Push] FCM not available, using Web Push API');
    return await setupWebPushSubscription(options);

  } catch (error) {
    console.error('[Push] Setup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
      platform
    };
  }
}

/**
 * Setup FCM token (for Chrome/Firefox)
 */
async function setupFCMToken(options: PushNotificationOptions): Promise<PushSetupResult> {
  const platform = isIOSPWA() ? 'ios-pwa' : (isIOS() ? 'ios-safari' : 'web');
  
  try {
    if (!messaging) {
      throw new Error('Firebase Messaging not available');
    }

    const token = await getToken(messaging as Messaging, { vapidKey: VAPID_PUBLIC_KEY });

    if (!token) {
      throw new Error('Failed to get FCM token');
    }

    if (options.saveToFirestore && options.userId) {
      await saveFCMTokenToFirestore(options.userId, token);
    }

    return {
      success: true,
      token,
      platform
    };
  } catch (error) {
    console.error('[Push] FCM setup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('FCM setup failed'),
      platform
    };
  }
}

/**
 * Setup Web Push subscription (works on iOS PWA)
 */
async function setupWebPushSubscription(options: PushNotificationOptions): Promise<PushSetupResult> {
  const platform = isIOSPWA() ? 'ios-pwa' : (isIOS() ? 'ios-safari' : 'web');
  
  try {
    const registration = await navigator.serviceWorker.ready;
    console.log('[Push] Service Worker ready');

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      console.log('[Push] Creating new subscription...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    console.log('[Push] Subscription:', subscription.endpoint);

    if (options.saveToFirestore && options.userId) {
      await saveWebPushSubscription(options.userId, subscription);
    }

    return {
      success: true,
      subscription,
      platform
    };
  } catch (error) {
    console.error('[Push] Web Push setup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Web Push setup failed'),
      platform
    };
  }
}

/**
 * Get device information
 */
function getDeviceInfo(): { device: string; platform: 'web' | 'mobile' | 'desktop'; userAgent: string } {
  const ua = navigator.userAgent;
  let device = 'Unknown Device';
  let platform: 'web' | 'mobile' | 'desktop' = 'web';

  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    platform = 'mobile';
    if (/iPhone/i.test(ua)) device = 'iPhone';
    else if (/iPad/i.test(ua)) device = 'iPad';
    else if (/Android/i.test(ua)) device = 'Android';
  } else {
    platform = 'desktop';
    if (/Mac/i.test(ua)) device = 'Mac';
    else if (/Win/i.test(ua)) device = 'Windows';
    else if (/Linux/i.test(ua)) device = 'Linux';
  }

  if (/Chrome/i.test(ua)) device += '/Chrome';
  else if (/Safari/i.test(ua)) device += '/Safari';
  else if (/Firefox/i.test(ua)) device += '/Firefox';
  else if (/Edge/i.test(ua)) device += '/Edge';

  return { device, platform, userAgent: ua };
}

/**
 * Save FCM token to Firestore
 */
export async function saveFCMTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const now = new Date().toISOString();
    const { device, platform, userAgent } = getDeviceInfo();

    const tokenData: FCMTokenData = {
      token,
      device,
      platform,
      userAgent,
      lastUsed: now,
      addedAt: now,
    };

    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const existingTokens: FCMTokenData[] = userData?.fcmTokens || [];
    const existingTokenIndex = existingTokens.findIndex((t) => t.token === token);

    if (existingTokenIndex >= 0) {
      existingTokens[existingTokenIndex] = { ...existingTokens[existingTokenIndex], lastUsed: now };
      await updateDoc(userDocRef, {
        fcmTokens: existingTokens,
        fcmToken: token,
        updatedAt: now,
      });
    } else {
      await setDoc(userDocRef, {
        fcmTokens: arrayUnion(tokenData),
        fcmToken: token,
        updatedAt: now,
      }, { merge: true });
    }

    console.log(`[Push] FCM token saved for: ${device}`);
  } catch (error) {
    console.error('[Push] Error saving FCM token:', error);
    throw error;
  }
}

/**
 * Save Web Push subscription to Firestore
 */
export async function saveWebPushSubscription(userId: string, subscription: PushSubscription): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const now = new Date().toISOString();
    const { device, platform, userAgent } = getDeviceInfo();

    const subscriptionData = {
      subscription: subscription.toJSON(),
      device,
      platform,
      userAgent,
      createdAt: now,
      lastUsed: now,
    };

    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const existingSubscriptions = userData?.webPushSubscriptions || [];

    const endpoint = subscription.endpoint;
    const existingIndex = existingSubscriptions.findIndex(
      (s: { subscription: { endpoint: string } }) => s.subscription?.endpoint === endpoint
    );

    if (existingIndex >= 0) {
      existingSubscriptions[existingIndex] = { ...existingSubscriptions[existingIndex], lastUsed: now };
      await updateDoc(userDocRef, {
        webPushSubscriptions: existingSubscriptions,
        'notificationSettings.enabled': true,
        updatedAt: now,
      });
    } else {
      await setDoc(userDocRef, {
        webPushSubscriptions: arrayUnion(subscriptionData),
        notificationSettings: {
          enabled: true,
          updatedAt: now,
        },
        updatedAt: now,
      }, { merge: true });
    }

    console.log(`[Push] Web Push subscription saved for: ${device}`);
  } catch (error) {
    console.error('[Push] Error saving subscription:', error);
    throw error;
  }
}

/**
 * Delete FCM token
 */
export async function deleteFCMToken(userId?: string, currentToken?: string): Promise<void> {
  try {
    let tokenToDelete = currentToken;
    if (!tokenToDelete && messaging) {
      try {
        tokenToDelete = await getToken(messaging as Messaging, { vapidKey: VAPID_PUBLIC_KEY });
      } catch (err) {
        console.warn('[Push] Could not get current token:', err);
      }
    }

    if (messaging) {
      await deleteToken(messaging as Messaging);
    }

    if (userId && tokenToDelete) {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const existingTokens: FCMTokenData[] = userData?.fcmTokens || [];

      const tokenToRemove = existingTokens.find((t) => t.token === tokenToDelete);

      if (tokenToRemove) {
        await updateDoc(userDocRef, {
          fcmTokens: arrayRemove(tokenToRemove),
          updatedAt: new Date().toISOString(),
        });
        console.log(`[Push] FCM token removed for: ${tokenToRemove.device}`);
      }
    }
  } catch (error) {
    console.error('[Push] Error deleting token:', error);
  }
}

/**
 * Unsubscribe from Web Push
 */
export async function unsubscribeWebPush(userId?: string): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      if (userId) {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const subscriptions = userData?.webPushSubscriptions || [];

        const toRemove = subscriptions.find(
          (s: { subscription: { endpoint: string } }) => s.subscription?.endpoint === endpoint
        );

        if (toRemove) {
          await updateDoc(userDocRef, {
            webPushSubscriptions: arrayRemove(toRemove),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      console.log('[Push] Unsubscribed from Web Push');
    }
  } catch (error) {
    console.error('[Push] Error unsubscribing:', error);
  }
}

/**
 * Set up foreground message handler
 */
export function setupForegroundMessageHandler(
  onMessageReceived: (payload: unknown) => void
): () => void {
  if (!messaging) {
    console.warn('[Push] Messaging not available');
    return () => {};
  }

  const unsubscribe = onMessage(messaging as Messaging, (payload) => {
    onMessageReceived(payload);
  });

  return unsubscribe;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check if FCM is supported
 */
export function isFCMSupported(): boolean {
  return isPushSupported() && messaging !== null;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  return await Notification.requestPermission();
}

/**
 * Send a local test notification
 */
export async function sendTestNotification(): Promise<void> {
  if (Notification.permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await navigator.serviceWorker.ready;
  
  await registration.showNotification('Тестова нотифікація 🎉', {
    body: 'Push нотифікації працюють! Все налаштовано правильно.',
    icon: '/ToDo-App/icons/icon-192.png',
    badge: '/ToDo-App/icons/icon-72.png',
    vibrate: [200, 100, 200],
    tag: 'test-notification',
    data: { url: '/ToDo-App/' }
  });

  console.log('[Push] Test notification sent');
}

// Legacy exports for backwards compatibility
export const requestFCMToken = requestPushNotifications;
export type FCMTokenResult = PushSetupResult;
export type FCMTokenOptions = PushNotificationOptions;

/**
 * FCM Service - Firebase Cloud Messaging Token Management
 *
 * Handles FCM token lifecycle:
 * - Request and retrieve FCM tokens
 * - Save tokens to Firestore
 * - Delete tokens on sign out
 * - Handle token refresh events
 */

import { getToken, deleteToken, onMessage, type Messaging } from 'firebase/messaging';
import { doc, setDoc, deleteField, updateDoc } from 'firebase/firestore';
import { messaging, db } from '@/config/firebase';

/**
 * Result of FCM token request operation
 */
export interface FCMTokenResult {
  success: boolean;
  token?: string;
  error?: Error;
}

/**
 * Options for requesting FCM token
 */
export interface FCMTokenOptions {
  vapidKey?: string;
  userId?: string;
  saveToFirestore?: boolean;
}

/**
 * Request FCM token from Firebase Messaging
 *
 * @param options - Configuration options for token request
 * @returns Promise resolving to FCM token result
 *
 * @example
 * const result = await requestFCMToken({
 *   vapidKey: 'your-vapid-key',
 *   userId: 'user123',
 *   saveToFirestore: true
 * });
 *
 * if (result.success) {
 *   console.log('FCM Token:', result.token);
 * }
 */
export async function requestFCMToken(options: FCMTokenOptions = {}): Promise<FCMTokenResult> {
  try {
    // Check if messaging is supported
    if (!messaging) {
      return {
        success: false,
        error: new Error('Firebase Messaging is not supported in this browser'),
      };
    }

    // Check notification permission
    if (typeof Notification === 'undefined') {
      return {
        success: false,
        error: new Error('Notifications are not supported in this browser'),
      };
    }

    if (Notification.permission !== 'granted') {
      return {
        success: false,
        error: new Error('Notification permission not granted'),
      };
    }

    // Get VAPID key from options or environment
    const vapidKey = options.vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      return {
        success: false,
        error: new Error('VAPID key not configured'),
      };
    }

    // Request FCM token
    const token = await getToken(messaging as Messaging, { vapidKey });

    if (!token) {
      return {
        success: false,
        error: new Error('Failed to retrieve FCM token'),
      };
    }

    // Optionally save to Firestore
    if (options.saveToFirestore && options.userId) {
      await saveFCMTokenToFirestore(options.userId, token);
    }

    return {
      success: true,
      token,
    };
  } catch (error) {
    console.error('Error requesting FCM token:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error requesting FCM token'),
    };
  }
}

/**
 * Save FCM token to Firestore user document
 *
 * @param userId - User ID to save token for
 * @param token - FCM token to save
 * @returns Promise resolving when token is saved
 *
 * @example
 * await saveFCMTokenToFirestore('user123', 'fcm-token-xyz');
 */
export async function saveFCMTokenToFirestore(userId: string, token: string): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);

    await setDoc(
      userDocRef,
      {
        fcmToken: token,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error);
    throw error;
  }
}

/**
 * Delete FCM token from device and Firestore
 *
 * Call this on sign out to remove the token association
 *
 * @param userId - User ID to delete token for
 * @returns Promise resolving when token is deleted
 *
 * @example
 * await deleteFCMToken('user123');
 */
export async function deleteFCMToken(userId?: string): Promise<void> {
  try {
    // Delete token from messaging instance
    if (messaging) {
      await deleteToken(messaging as Messaging);
    }

    // Remove token from Firestore if userId provided
    if (userId) {
      const userDocRef = doc(db, 'users', userId);

      await updateDoc(userDocRef, {
        fcmToken: deleteField(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    // Don't throw - token deletion should not block sign out
  }
}

/**
 * Set up foreground message handler
 *
 * @param onMessageReceived - Callback to handle received messages
 * @returns Unsubscribe function to clean up listener
 *
 * @example
 * const unsubscribe = setupForegroundMessageHandler((payload) => {
 *   console.log('Message received:', payload);
 *   showToast(payload.notification?.title || 'Notification');
 * });
 *
 * // Clean up on unmount
 * return () => unsubscribe();
 */
export function setupForegroundMessageHandler(
  onMessageReceived: (payload: unknown) => void
): () => void {
  if (!messaging) {
    console.warn('Messaging not available - foreground messages will not be received');
    return () => {}; // Return no-op unsubscribe
  }

  const unsubscribe = onMessage(messaging as Messaging, (payload) => {
    onMessageReceived(payload);
  });

  return unsubscribe;
}

/**
 * Check if FCM is supported in current environment
 *
 * @returns True if FCM is supported and enabled
 *
 * @example
 * if (isFCMSupported()) {
 *   await requestFCMToken();
 * }
 */
export function isFCMSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    messaging !== null
  );
}

/**
 * Request notification permission from browser
 *
 * @returns Promise resolving to granted permission status
 *
 * @example
 * const permission = await requestNotificationPermission();
 * if (permission === 'granted') {
 *   await requestFCMToken();
 * }
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}
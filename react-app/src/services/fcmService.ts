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
import { doc, setDoc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { messaging, db } from '@/config/firebase';
import type { FCMTokenData } from '@/types/user.types';

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
 * Get device information for FCM token
 *
 * @returns Device info object
 */
function getDeviceInfo(): { device: string; platform: 'web' | 'mobile' | 'desktop'; userAgent: string } {
  const ua = navigator.userAgent;
  let device = 'Unknown Device';
  let platform: 'web' | 'mobile' | 'desktop' = 'web';

  // Detect mobile
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    platform = 'mobile';
    if (/iPhone/i.test(ua)) device = 'iPhone';
    else if (/iPad/i.test(ua)) device = 'iPad';
    else if (/Android/i.test(ua)) device = 'Android';
  }
  // Detect desktop
  else {
    platform = 'desktop';
    if (/Mac/i.test(ua)) device = 'Mac';
    else if (/Win/i.test(ua)) device = 'Windows';
    else if (/Linux/i.test(ua)) device = 'Linux';
  }

  // Add browser info
  if (/Chrome/i.test(ua)) device += '/Chrome';
  else if (/Safari/i.test(ua)) device += '/Safari';
  else if (/Firefox/i.test(ua)) device += '/Firefox';
  else if (/Edge/i.test(ua)) device += '/Edge';

  return { device, platform, userAgent: ua };
}

/**
 * Save FCM token to Firestore user document (as array for multi-device support)
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
    const now = new Date().toISOString();

    // Get current user doc to check existing tokens
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    // Get device info
    const { device, platform, userAgent } = getDeviceInfo();

    // Create token data object
    const tokenData: FCMTokenData = {
      token,
      device,
      platform,
      userAgent,
      lastUsed: now,
      addedAt: now,
    };

    // Get existing tokens array
    const existingTokens: FCMTokenData[] = userData?.fcmTokens || [];

    // Check if this token already exists
    const existingTokenIndex = existingTokens.findIndex((t) => t.token === token);

    if (existingTokenIndex >= 0) {
      // Update existing token's lastUsed
      existingTokens[existingTokenIndex] = {
        ...existingTokens[existingTokenIndex],
        lastUsed: now,
      };

      await updateDoc(userDocRef, {
        fcmTokens: existingTokens,
        fcmToken: token, // Keep for backwards compatibility
        updatedAt: now,
      });
    } else {
      // Add new token to array
      await setDoc(
        userDocRef,
        {
          fcmTokens: arrayUnion(tokenData),
          fcmToken: token, // Keep for backwards compatibility
          updatedAt: now,
        },
        { merge: true }
      );
    }

    console.log(`FCM token saved for device: ${device}`);
  } catch (error) {
    console.error('Error saving FCM token to Firestore:', error);
    throw error;
  }
}

/**
 * Delete FCM token from device and Firestore (removes from tokens array)
 *
 * Call this on sign out to remove the token association
 *
 * @param userId - User ID to delete token for
 * @param currentToken - Optional current FCM token to remove (if not provided, will get from messaging)
 * @returns Promise resolving when token is deleted
 *
 * @example
 * await deleteFCMToken('user123');
 */
export async function deleteFCMToken(userId?: string, currentToken?: string): Promise<void> {
  try {
    // Get current token if not provided
    let tokenToDelete = currentToken;
    if (!tokenToDelete && messaging) {
      try {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (vapidKey) {
          tokenToDelete = await getToken(messaging as Messaging, { vapidKey });
        }
      } catch (err) {
        console.warn('Could not get current token for deletion:', err);
      }
    }

    // Delete token from messaging instance
    if (messaging) {
      await deleteToken(messaging as Messaging);
    }

    // Remove token from Firestore if userId provided
    if (userId && tokenToDelete) {
      const userDocRef = doc(db, 'users', userId);

      // Get current user doc to find the token to remove
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      const existingTokens: FCMTokenData[] = userData?.fcmTokens || [];

      // Find and remove the token from array
      const tokenToRemove = existingTokens.find((t) => t.token === tokenToDelete);

      if (tokenToRemove) {
        await updateDoc(userDocRef, {
          fcmTokens: arrayRemove(tokenToRemove),
          updatedAt: new Date().toISOString(),
        });

        console.log(`FCM token removed for device: ${tokenToRemove.device}`);
      }
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
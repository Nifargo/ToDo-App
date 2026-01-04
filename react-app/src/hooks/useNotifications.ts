import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  requestPushNotifications,
  deleteFCMToken,
  unsubscribeWebPush,
  setupForegroundMessageHandler,
  isPushSupported,
  isIOS,
  isIOSPWA,
  isIOSPushSupported,
  requestNotificationPermission,
  sendTestNotification,
} from '@/services/fcmService';

/**
 * Notification payload from FCM/Web Push
 */
interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
    icon?: string;
  };
  data?: Record<string, string>;
}

/**
 * Hook result interface
 */
interface UseNotificationsResult {
  permission: NotificationPermission;
  token: string | null;
  loading: boolean;
  error: Error | null;
  requestPermission: () => Promise<void>;
  revokePermission: () => Promise<void>;
  sendTest: () => Promise<void>;
  isSupported: boolean;
  isIOSDevice: boolean;
  isIOSPWAMode: boolean;
  requiresHomeScreen: boolean;
}

/**
 * Custom hook for managing push notifications
 * 
 * Supports:
 * - Firebase Cloud Messaging (FCM) for Chrome/Firefox/Edge
 * - Standard Web Push API for iOS PWA (16.4+)
 *
 * @param onNotificationReceived - Optional callback for foreground notifications
 * @returns Notification state and control functions
 */
export function useNotifications(
  onNotificationReceived?: (payload: NotificationPayload) => void
): UseNotificationsResult {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Platform detection
  const isIOSDevice = isIOS();
  const isIOSPWAMode = isIOSPWA();
  const requiresHomeScreen = isIOSDevice && !isIOSPWAMode;

  // Check if notifications are supported
  useEffect(() => {
    // Basic push support check
    let supported = isPushSupported();

    // Additional iOS checks
    if (isIOSDevice) {
      if (!isIOSPushSupported()) {
        console.log('[useNotifications] iOS version too old for push');
        supported = false;
      } else if (!isIOSPWAMode) {
        console.log('[useNotifications] iOS requires Home Screen installation');
        // Still mark as "supported" but will show guidance to user
        supported = true;
      }
    }

    setIsSupported(supported);

    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }

    console.log('[useNotifications] Platform:', {
      isIOSDevice,
      isIOSPWAMode,
      isSupported: supported,
      permission: Notification?.permission
    });
  }, [isIOSDevice, isIOSPWAMode]);

  // Set up foreground message handler (not for iOS PWA - they use service worker only)
  useEffect(() => {
    if (!isSupported || !user || isIOSPWAMode) {
      return;
    }

    const unsubscribe = setupForegroundMessageHandler((payload) => {
      const typedPayload = payload as NotificationPayload;

      if (onNotificationReceived) {
        onNotificationReceived(typedPayload);
      } else if (typedPayload.notification && Notification.permission === 'granted') {
        const { title, body, icon } = typedPayload.notification;
        new Notification(title || 'Notification', {
          body: body || '',
          icon: icon || '/ToDo-App/icons/icon-192.png',
          badge: '/ToDo-App/icons/icon-192.png',
          tag: 'task-notification',
          requireInteraction: false,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, isSupported, isIOSPWAMode, onNotificationReceived]);

  /**
   * Request notification permission and set up push subscription
   */
  const requestPermission = useCallback(async (): Promise<void> => {
    // Check if iOS but not in PWA mode
    if (isIOSDevice && !isIOSPWAMode) {
      setError(new Error('Please add this app to your Home Screen first, then enable notifications.'));
      throw new Error('iOS requires Home Screen installation');
    }

    if (!isSupported) {
      setError(new Error('Notifications not supported in this browser'));
      throw new Error('Notifications not supported');
    }

    try {
      setLoading(true);
      setError(null);

      // Use unified push notifications function
      const result = await requestPushNotifications({
        userId: user?.uid,
        saveToFirestore: true,
      });

      // Update permission state
      if (typeof Notification !== 'undefined') {
        setPermission(Notification.permission);
      }

      if (!result.success) {
        throw result.error || new Error('Failed to set up notifications');
      }

      setToken(result.token || null);
      console.log('[useNotifications] Push setup successful:', result.platform);

    } catch (err) {
      console.error('[useNotifications] Error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isSupported, isIOSDevice, isIOSPWAMode, user]);

  /**
   * Revoke push subscription (call on sign out or disable notifications)
   */
  const revokePermission = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Delete FCM token
      await deleteFCMToken(user?.uid);
      
      // Also unsubscribe from Web Push
      await unsubscribeWebPush(user?.uid);
      
      setToken(null);
    } catch (err) {
      console.error('[useNotifications] Error revoking:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Send a test notification
   */
  const sendTest = useCallback(async (): Promise<void> => {
    try {
      await sendTestNotification();
    } catch (err) {
      console.error('[useNotifications] Test notification error:', err);
      throw err;
    }
  }, []);

  return {
    permission,
    token,
    loading,
    error,
    requestPermission,
    revokePermission,
    sendTest,
    isSupported,
    isIOSDevice,
    isIOSPWAMode,
    requiresHomeScreen,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  requestFCMToken,
  deleteFCMToken,
  setupForegroundMessageHandler,
  isFCMSupported,
  requestNotificationPermission,
} from '@/services/fcmService';

/**
 * Notification payload from FCM
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
  isSupported: boolean;
}

/**
 * Custom hook for managing FCM push notifications
 *
 * Features:
 * - Request notification permission
 * - Manage FCM tokens
 * - Handle foreground messages with Toast
 * - Graceful degradation when FCM not available
 *
 * @param onNotificationReceived - Optional callback for foreground notifications
 * @returns Notification state and control functions
 *
 * @example
 * const { permission, requestPermission, isSupported } = useNotifications((payload) => {
 *   toast.success(payload.notification?.title || 'New notification');
 * });
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

  // Check if notifications are supported
  useEffect(() => {
    const supported = isFCMSupported();
    setIsSupported(supported);

    if (supported && typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  // Set up foreground message handler
  useEffect(() => {
    if (!isSupported || !user) {
      return;
    }

    const unsubscribe = setupForegroundMessageHandler((payload) => {
      const typedPayload = payload as NotificationPayload;

      // Call user-provided callback if available
      if (onNotificationReceived) {
        onNotificationReceived(typedPayload);
      } else {
        // Default behavior: show browser notification
        if (typedPayload.notification) {
          const { title, body, icon } = typedPayload.notification;

          // Only show notification if permission is granted
          if (Notification.permission === 'granted') {
            new Notification(title || 'Notification', {
              body: body || '',
              icon: icon || '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              tag: 'task-notification', // Prevent duplicate notifications
              requireInteraction: false,
            });
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, isSupported, onNotificationReceived]);

  /**
   * Request notification permission and FCM token
   */
  const requestPermission = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError(new Error('Notifications not supported in this browser'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Request browser notification permission
      const permission = await requestNotificationPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Request FCM token
      const result = await requestFCMToken({
        userId: user?.uid,
        saveToFirestore: true,
      });

      if (!result.success) {
        throw result.error || new Error('Failed to get FCM token');
      }

      setToken(result.token || null);
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError(err as Error);
      throw err; // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  }, [isSupported, user]);

  /**
   * Revoke FCM token (call on sign out or disable notifications)
   */
  const revokePermission = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await deleteFCMToken(user?.uid);
      setToken(null);
    } catch (err) {
      console.error('Error revoking FCM token:', err);
      setError(err as Error);
      // Don't throw - token revocation should not block operations
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    permission,
    token,
    loading,
    error,
    requestPermission,
    revokePermission,
    isSupported,
  };
}
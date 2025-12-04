import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import type { Messaging } from 'firebase/messaging';
import { messaging } from '@/config/firebase';
import { useAuth } from './useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface UseNotificationsResult {
  permission: NotificationPermission;
  token: string | null;
  loading: boolean;
  error: Error | null;
  requestPermission: () => Promise<void>;
  isSupported: boolean;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    // Check if notifications are supported
    const checkSupport = async (): Promise<void> => {
      const supported = 'Notification' in window && messaging !== null;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  useEffect(() => {
    // Set up foreground message handler
    if (messaging && user) {
      const unsubscribe = onMessage(messaging as Messaging, (payload) => {
        console.log('Foreground message received:', payload);

        if (payload.notification) {
          const { title, body } = payload.notification;
          new Notification(title || 'Notification', {
            body: body || '',
            icon: '/icons/icon-192.png',
          });
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  const requestPermission = async (): Promise<void> => {
    if (!isSupported || !messaging) {
      setError(new Error('Notifications not supported in this browser'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
          throw new Error('VAPID key not configured');
        }

        const currentToken = await getToken(messaging as Messaging, { vapidKey });

        if (currentToken) {
          setToken(currentToken);

          // Save token to Firestore for the user
          if (user) {
            await setDoc(
              doc(db, 'users', user.uid),
              {
                fcmToken: currentToken,
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }
        } else {
          console.warn('No FCM token available');
        }
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    permission,
    token,
    loading,
    error,
    requestPermission,
    isSupported,
  };
}
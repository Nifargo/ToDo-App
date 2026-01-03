import { type FC, useState, useEffect } from 'react';
import { Bell, Clock } from 'lucide-react';
import Switch from '@/components/ui/Switch';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { NotificationSettings as NotificationSettingsType } from '@/types';

interface NotificationSettingsProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onClose: () => void;
}

const NotificationSettings: FC<NotificationSettingsProps> = ({ onSuccess, onError, onClose }) => {
  const { user } = useAuth();
  const { permission, requestPermission, loading: permissionLoading, isSupported } = useNotifications();

  const [settings, setSettings] = useState<NotificationSettingsType>({
    enabled: false,
    time: '09:00',
    notifyDueToday: true,
    notifyOverdue: true,
    notifyDueTomorrow: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from Firestore
  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      if (!user) return;

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.notificationSettings) {
            setSettings(userData.notificationSettings);
          }
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        onError('Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, onError]);

  // Sync with browser permission state (run once after loading)
  useEffect(() => {
    const syncPermissionState = async (): Promise<void> => {
      if (!user || loading) return;

      // If Firestore says enabled, but browser permission is not granted
      if (settings.enabled && permission !== 'granted') {
        console.warn('⚠️  Notification mismatch: Firestore enabled but browser permission not granted');

        // Auto-disable in Firestore to match reality
        const syncedSettings = { ...settings, enabled: false };

        try {
          const docRef = doc(db, 'users', user.uid);
          await setDoc(
            docRef,
            {
              notificationSettings: syncedSettings,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );

          setSettings(syncedSettings);
          onError('Notifications were auto-disabled. Browser permission was revoked. Please re-enable.');
        } catch (error) {
          console.error('Failed to sync notification state:', error);
        }
      }
    };

    // Only sync once after initial load
    if (!loading) {
      syncPermissionState();
    }
  }, [loading]); // Only run when loading changes from true to false

  // Save settings to Firestore
  const handleSaveSettings = async (settingsToSave?: NotificationSettingsType): Promise<void> => {
    if (!user) return;

    const dataToSave = settingsToSave || settings;

    try {
      setSaving(true);
      const docRef = doc(db, 'users', user.uid);

      await setDoc(
        docRef,
        {
          notificationSettings: dataToSave,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      onSuccess('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      onError('Failed to save notification settings');
      throw error; // Re-throw to handle in caller
    } finally {
      setSaving(false);
    }
  };

  const handleEnableNotifications = async (enabled: boolean): Promise<void> => {
    // Create new settings object
    const newSettings = { ...settings, enabled };

    // Update the UI state first
    setSettings(newSettings);

    // If enabling notifications, try to request permission and FCM token
    if (enabled && permission !== 'granted' && isSupported) {
      try {
        // This will request permission AND save FCM token to Firestore
        await requestPermission();
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        onError('Failed to enable notifications. Please check your browser settings.');
        // Revert the state if permission failed
        setSettings(settings);
        return;
      }
    }

    // Save settings to Firestore with the new settings object
    try {
      await handleSaveSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      // Revert the state if save failed
      setSettings(settings);
    }
  };

  const handleSettingChange = (key: keyof NotificationSettingsType, value: boolean | string): void => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning if notifications not supported (only show on non-HTTPS) */}
      {!isSupported && window.location.protocol !== 'https:' && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 backdrop-blur-xl animate-fade-in">
          <p className="text-sm text-white/80">
            ⚠️ Notifications require HTTPS.
            Settings will be saved for when notifications become available.
          </p>
        </div>
      )}

      {/* Warning if settings say enabled but browser permission not granted */}
      {settings.enabled && permission !== 'granted' && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-4 backdrop-blur-xl animate-fade-in">
          <p className="text-sm text-white/80 font-semibold mb-2">
            ⚠️ Notification Permission Lost
          </p>
          <p className="text-sm text-white/70">
            Notifications are enabled in settings, but browser permission is missing.
            This can happen after clearing browser data or reinstalling the app.
            Please toggle notifications off and on again to restore permission.
          </p>
        </div>
      )}

      {/* Enable Notifications Toggle */}
      <div className="holographic-border rounded-xl border-2 border-violet-300/70 bg-gradient-to-br from-indigo-500/95 via-purple-500/95 to-fuchsia-600/95 p-6 shadow-2xl shadow-indigo-500/60 backdrop-blur-2xl">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-white" />
          <h3 className="font-geometric text-lg font-semibold text-white drop-shadow-lg">
            Push Notifications
          </h3>
        </div>

        <Switch
          checked={settings.enabled}
          onChange={(e) => handleEnableNotifications(e.target.checked)}
          disabled={permissionLoading}
          label="Enable Notifications"
          description={
            permission === 'denied'
              ? 'Notifications are blocked. Please enable them in your browser settings.'
              : 'Receive push notifications for your tasks'
          }
        />

        {permission === 'denied' && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 backdrop-blur-xl">
            <p className="text-sm text-white/80">
              Notifications are blocked. Please enable them in your browser settings to receive task reminders.
            </p>
          </div>
        )}
      </div>

      {/* Notification Preferences (only visible if enabled) */}
      {settings.enabled && (
        <div className="holographic-border animate-fade-in rounded-xl border-2 border-violet-300/70 bg-gradient-to-br from-indigo-500/95 via-purple-500/95 to-fuchsia-600/95 p-6 shadow-2xl shadow-indigo-500/60 backdrop-blur-2xl">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-white" />
            <h3 className="font-geometric text-lg font-semibold text-white drop-shadow-lg">
              Notification Preferences
            </h3>
          </div>

          <div className="space-y-4">
            {/* Daily Reminder Time */}
            <div>
              <Input
                type="time"
                label="Daily Reminder Time"
                value={settings.time}
                onChange={(e) => handleSettingChange('time', e.target.value)}
                className="text-white"
              />
            </div>

            {/* Notification Types */}
            <div className="space-y-3">
              <Switch
                checked={settings.notifyDueToday}
                onChange={(e) => handleSettingChange('notifyDueToday', e.target.checked)}
                label="Tasks due today"
                description="Get notified about tasks due today"
              />

              <Switch
                checked={settings.notifyOverdue}
                onChange={(e) => handleSettingChange('notifyOverdue', e.target.checked)}
                label="Overdue tasks"
                description="Get notified about overdue tasks"
              />

              <Switch
                checked={settings.notifyDueTomorrow}
                onChange={(e) => handleSettingChange('notifyDueTomorrow', e.target.checked)}
                label="Tasks due tomorrow"
                description="Get notified about tasks due tomorrow"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={async () => {
                  try {
                    await handleSaveSettings();
                    // Close settings panel after successful save
                    setTimeout(() => onClose(), 500);
                  } catch {
                    // Error already handled in handleSaveSettings
                  }
                }}
                loading={saving}
                fullWidth
                className="border border-white/30 bg-white text-indigo-700 shadow-lg hover:bg-white/90"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
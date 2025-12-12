import { type FC, useState } from 'react';
import { User, LogOut, Bell, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Container from '@/components/layout/Container';
import Button from '@/components/ui/Button';
import NotificationSettings from './NotificationSettings';

interface SettingsScreenProps {
  onSignOut?: () => void;
  onShowToast: (variant: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const SettingsScreen: FC<SettingsScreenProps> = ({ onSignOut, onShowToast }) => {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const handleSignOut = async (): Promise<void> => {
    const confirmed = window.confirm(
      'Are you sure you want to sign out?'
    );

    if (!confirmed) return;

    try {
      setSigningOut(true);
      await signOut();
      onShowToast('success', 'Signed out successfully');
      onSignOut?.();
    } catch (error) {
      console.error('Error signing out:', error);
      onShowToast('error', 'Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleNotificationSuccess = (message: string): void => {
    onShowToast('success', message);
  };

  const handleNotificationError = (message: string): void => {
    onShowToast('error', message);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900">
      {/* Ambient Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="ambient-orb absolute -right-40 -top-40 h-[500px] w-[500px] bg-indigo-400/25"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="ambient-orb absolute -bottom-40 -left-40 h-[500px] w-[500px] bg-violet-400/25"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="ambient-orb absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 bg-fuchsia-400/15"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 pb-20 pt-6 md:pb-6">
        <Container maxWidth="xl">
          {/* Header */}
          <section className="mb-6 animate-fade-in px-2">
            <h1 className="font-geometric holographic-text mb-2 text-3xl font-bold">
              Settings
            </h1>
            <p className="text-sm font-medium text-white/70 md:text-base">
              {user ? 'Manage your account and preferences' : 'App settings and information'}
            </p>
          </section>

          {/* Guest Notice - Only show for guests */}
          {!user && (
            <section
              className="mb-6 animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="holographic-border rounded-xl border-2 border-indigo-300/70 bg-gradient-to-br from-indigo-500/95 via-purple-500/95 to-fuchsia-600/95 p-6 shadow-2xl shadow-indigo-500/60 backdrop-blur-2xl">
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-white" />
                  <h2 className="font-geometric text-lg font-semibold text-white drop-shadow-lg">
                    Guest Mode
                  </h2>
                </div>
                <p className="mb-3 text-sm text-white/80">
                  You're using the app as a guest. Your tasks are saved locally on this device.
                </p>
                <p className="text-sm text-white/70">
                  Sign in to unlock: cross-device sync, notifications, and cloud backup.
                </p>
              </div>
            </section>
          )}

          {/* Profile Section - Only show for authenticated users */}
          {user && (
            <section
              className="mb-6 animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="holographic-border rounded-xl border-2 border-violet-300/70 bg-gradient-to-br from-indigo-500/95 via-purple-500/95 to-fuchsia-600/95 p-6 shadow-2xl shadow-indigo-500/60 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-white" />
                  <h2 className="font-geometric text-lg font-semibold text-white drop-shadow-lg">
                    Profile
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="h-16 w-16 flex-shrink-0 rounded-full border-4 border-white/30 shadow-lg"
                    />
                  ) : (
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white/10 shadow-lg">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="font-geometric truncate text-xl font-bold text-white drop-shadow-lg">
                      {user.displayName || 'User'}
                    </h3>
                    <p className="truncate text-sm text-white/80">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Notifications Section - Only show for authenticated users */}
          {user && (
            <section
              className="mb-6 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              {showNotificationSettings ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowNotificationSettings(false)}
                    className="flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    Back to Settings
                  </button>
                  <NotificationSettings
                    onSuccess={handleNotificationSuccess}
                    onError={handleNotificationError}
                    onClose={() => setShowNotificationSettings(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowNotificationSettings(true)}
                  className="holographic-border group w-full rounded-xl border-2 border-violet-300/70 bg-gradient-to-br from-indigo-500/95 via-purple-500/95 to-fuchsia-600/95 p-6 shadow-2xl shadow-indigo-500/60 backdrop-blur-2xl transition-all hover:scale-[1.02] hover:shadow-indigo-500/80"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                        <Bell className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-geometric text-base font-semibold text-white drop-shadow-lg">
                          Notifications
                        </h3>
                        <p className="text-sm text-white/70">
                          Manage your notification preferences
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/50 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              )}
            </section>
          )}

          {/* App Info Section */}
          <section
            className="mb-6 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="holographic-border rounded-xl border-2 border-violet-300/70 bg-gradient-to-br from-indigo-500/95 via-purple-500/95 to-fuchsia-600/95 p-6 shadow-2xl shadow-indigo-500/60 backdrop-blur-2xl">
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-white" />
                <h2 className="font-geometric text-lg font-semibold text-white drop-shadow-lg">
                  App Information
                </h2>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Version</span>
                  <span className="font-medium text-white">
                    {import.meta.env.VITE_APP_VERSION || '1.0.0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">App Name</span>
                  <span className="font-medium text-white">
                    {import.meta.env.VITE_APP_NAME || 'My Tasks'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Account Actions Section - Only show for authenticated users */}
          {user && (
            <section
              className="animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="holographic-border rounded-xl border-2 border-red-300/70 bg-gradient-to-br from-red-500/95 via-rose-500/95 to-red-600/95 p-6 shadow-2xl shadow-red-500/60 backdrop-blur-2xl">
                <div className="mb-4 flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-white" />
                  <h2 className="font-geometric text-lg font-semibold text-white drop-shadow-lg">
                    Account
                  </h2>
                </div>

                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleSignOut}
                  loading={signingOut}
                  fullWidth
                  className="border border-white/30 bg-white text-red-700 shadow-lg hover:bg-white/90"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </Button>
              </div>
            </section>
          )}
        </Container>
      </main>
    </div>
  );
};

export default SettingsScreen;
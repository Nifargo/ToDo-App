import { useState } from 'react';
import { Search, Mail, Lock } from 'lucide-react';

// Auth
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/auth/LoginScreen';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Layout Components
import Header from './components/layout/Header';
import BottomNav, { type NavItem } from './components/layout/BottomNav';
import Container from './components/layout/Container';

// UI Components
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Checkbox from './components/ui/Checkbox';
import Modal from './components/ui/Modal';
import { ToastContainer } from './components/ui/Toast';

interface Toast {
  id: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeNav, setActiveNav] = useState<NavItem>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (variant: Toast['variant'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, variant, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToast('success', 'Loading completed successfully!');
    }, 2000);
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      addToast('success', 'Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      addToast('error', 'Failed to sign out');
    }
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <LoadingSpinner
        size="lg"
        text="Loading..."
        fullScreen
      />
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="pb-20 pt-6 md:pb-6">
        <Container maxWidth="xl">
          {/* Welcome Section */}
          <section className="mb-8">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
                    Welcome, {user.displayName || 'User'}!
                  </h1>
                  <p className="text-gray-600">
                    {user.email}
                  </p>
                </div>
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="h-16 w-16 rounded-full border-2 border-indigo-500"
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </section>

          {/* Component Library Demo Section */}
          <section className="mb-8">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Component Library Demo
              </h2>
              <p className="text-gray-600">
                React + TypeScript + Tailwind CSS + Liquid Glass Effects
              </p>
            </div>
          </section>

          {/* Buttons Section */}
          <section className="mb-8">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Buttons
              </h2>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="sm">
                  Primary Small
                </Button>
                <Button variant="secondary" size="md">
                  Secondary Medium
                </Button>
                <Button variant="danger" size="lg">
                  Danger Large
                </Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="primary" loading>
                  Loading...
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </section>

          {/* Inputs Section */}
          <section className="mb-8">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Inputs
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  leftIcon={<Mail className="h-5 w-5" />}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter password"
                  leftIcon={<Lock className="h-5 w-5" />}
                />
                <Input
                  label="Search"
                  type="text"
                  placeholder="Search..."
                  rightIcon={<Search className="h-5 w-5" />}
                />
                <Input
                  label="With Error"
                  type="text"
                  error="This field is required"
                  placeholder="Error state"
                />
              </div>
            </div>
          </section>

          {/* Checkboxes Section */}
          <section className="mb-8">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Checkboxes
              </h2>
              <div className="flex flex-col gap-3">
                <Checkbox
                  label="Remember me"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                />
                <Checkbox label="Subscribe to newsletter" />
                <Checkbox label="Accept terms and conditions" checked />
                <Checkbox label="Disabled option" disabled />
              </div>
            </div>
          </section>

          {/* Interactive Demos Section */}
          <section className="mb-8">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Interactive Demos
              </h2>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                >
                  Open Modal
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => addToast('success', 'Success message!')}
                >
                  Show Success Toast
                </Button>
                <Button
                  variant="danger"
                  onClick={() => addToast('error', 'Error occurred!')}
                >
                  Show Error Toast
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => addToast('warning', 'Warning: Check this out')}
                >
                  Show Warning Toast
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => addToast('info', 'Information message')}
                >
                  Show Info Toast
                </Button>
                <Button variant="primary" onClick={handleLoadingDemo}>
                  Loading Demo (2s)
                </Button>
              </div>
            </div>
          </section>

          {/* Loading Spinner Section */}
          <section className="mb-8">
            <div className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Loading Spinners
              </h2>
              <div className="flex flex-wrap items-center gap-8">
                <LoadingSpinner size="sm" text="Small" />
                <LoadingSpinner size="md" text="Medium" />
                <LoadingSpinner size="lg" text="Large" />
              </div>
            </div>
          </section>
        </Container>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeItem={activeNav} onItemClick={setActiveNav} />

      {/* Modal Demo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal Demo"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This is a beautiful modal with glass effect. It supports:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-gray-600">
            <li>Backdrop blur effect</li>
            <li>Click outside to close</li>
            <li>ESC key to close</li>
            <li>Smooth animations</li>
            <li>Portal rendering</li>
          </ul>
          <div className="flex gap-2 pt-4">
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                addToast('success', 'Modal action confirmed!');
              }}
            >
              Confirm
            </Button>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Full Screen Loading */}
      {isLoading && (
        <LoadingSpinner
          size="lg"
          text="Loading, please wait..."
          fullScreen
        />
      )}
    </div>
  );
}

export default App;
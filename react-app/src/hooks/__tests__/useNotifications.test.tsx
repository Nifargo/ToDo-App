import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useNotifications } from '../useNotifications';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock Firebase Auth
const mockOnAuthStateChanged = vi.fn();

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('@/config/firebase', () => ({
  auth: {},
  googleProvider: {},
  messaging: {},
  db: {},
}));

// Mock FCM Service
const mockRequestFCMToken = vi.fn();
const mockDeleteFCMToken = vi.fn();
const mockSetupForegroundMessageHandler = vi.fn();
const mockIsFCMSupported = vi.fn();
const mockRequestNotificationPermission = vi.fn();

vi.mock('@/services/fcmService', () => ({
  requestFCMToken: (...args: unknown[]) => mockRequestFCMToken(...args),
  deleteFCMToken: (...args: unknown[]) => mockDeleteFCMToken(...args),
  setupForegroundMessageHandler: (...args: unknown[]) =>
    mockSetupForegroundMessageHandler(...args),
  isFCMSupported: () => mockIsFCMSupported(),
  requestNotificationPermission: (...args: unknown[]) =>
    mockRequestNotificationPermission(...args),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteField: vi.fn(),
}));

describe('useNotifications', () => {
  // Mock Notification API
  const mockNotification = {
    permission: 'default' as NotificationPermission,
    requestPermission: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback({
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
      });
      return vi.fn();
    });

    mockIsFCMSupported.mockReturnValue(true);
    mockSetupForegroundMessageHandler.mockReturnValue(vi.fn()); // Return unsubscribe function

    // Mock Notification API
    Object.defineProperty(global, 'Notification', {
      writable: true,
      value: mockNotification,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('Initial State', () => {
    it('should return initial state with default values', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.permission).toBe('default');
        expect(result.current.token).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      expect(result.current.requestPermission).toBeDefined();
      expect(result.current.revokePermission).toBeDefined();
      expect(typeof result.current.requestPermission).toBe('function');
      expect(typeof result.current.revokePermission).toBe('function');
    });

    it('should detect FCM support', async () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSupported).toBe(true);
      });

      expect(mockIsFCMSupported).toHaveBeenCalled();
    });

    it('should detect when FCM is not supported', async () => {
      mockIsFCMSupported.mockReturnValue(false);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSupported).toBe(false);
      });
    });
  });

  describe('Foreground Message Handler', () => {
    it('should set up foreground message handler when supported', async () => {
      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(mockSetupForegroundMessageHandler).toHaveBeenCalled();
      });
    });

    it('should call custom callback when notification received', async () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      mockSetupForegroundMessageHandler.mockImplementation((callback) => {
        // Simulate foreground message
        setTimeout(() => {
          callback({
            notification: {
              title: 'Test Notification',
              body: 'Test Body',
            },
          });
        }, 100);
        return mockUnsubscribe;
      });

      renderHook(() => useNotifications(mockCallback), { wrapper });

      await waitFor(
        () => {
          expect(mockCallback).toHaveBeenCalledWith({
            notification: {
              title: 'Test Notification',
              body: 'Test Body',
            },
          });
        },
        { timeout: 500 }
      );
    });

    it('should not set up handler when FCM not supported', async () => {
      mockIsFCMSupported.mockReturnValue(false);

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(mockSetupForegroundMessageHandler).not.toHaveBeenCalled();
      });
    });

    it('should not set up handler when user is not authenticated', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null); // No user
        return vi.fn();
      });

      renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(mockSetupForegroundMessageHandler).not.toHaveBeenCalled();
      });
    });

    it('should clean up message handler on unmount', async () => {
      const mockUnsubscribe = vi.fn();
      mockSetupForegroundMessageHandler.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(mockSetupForegroundMessageHandler).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('requestPermission', () => {
    it('should successfully request permission and FCM token', async () => {
      mockRequestNotificationPermission.mockResolvedValue('granted');
      mockRequestFCMToken.mockResolvedValue({
        success: true,
        token: 'test-fcm-token-123',
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(mockRequestNotificationPermission).toHaveBeenCalled();
      expect(mockRequestFCMToken).toHaveBeenCalledWith({
        userId: 'test-user-123',
        saveToFirestore: true,
      });

      await waitFor(() => {
        expect(result.current.token).toBe('test-fcm-token-123');
        expect(result.current.permission).toBe('granted');
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle permission denied', async () => {
      mockRequestNotificationPermission.mockResolvedValue('denied');

      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Catch error inside act() to allow React to flush state updates
      await act(async () => {
        try {
          await result.current.requestPermission();
        } catch (error: any) {
          expect(error.message).toContain('Notification permission denied');
        }
      });

      // Error should now be set in state
      expect(result.current.permission).toBe('denied');
      expect(result.current.token).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should handle FCM token request failure', async () => {
      mockRequestNotificationPermission.mockResolvedValue('granted');
      mockRequestFCMToken.mockResolvedValue({
        success: false,
        error: new Error('Failed to get FCM token'),
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Catch error inside act() to allow React to flush state updates
      await act(async () => {
        try {
          await result.current.requestPermission();
        } catch (error: any) {
          expect(error.message).toContain('Failed to get FCM token');
        }
      });

      // Error should now be set in state
      expect(result.current.token).toBeNull();
      expect(result.current.error).toBeTruthy();
    });

    it('should set loading state while requesting', async () => {
      mockRequestNotificationPermission.mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve('granted'), 100));
      });

      mockRequestFCMToken.mockResolvedValue({
        success: true,
        token: 'test-token',
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      const permissionPromise = result.current.requestPermission();

      // Check loading state (should be true during request)
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await act(async () => {
        await permissionPromise;
      });

      // After completion, should be false
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear previous error before requesting', async () => {
      mockRequestNotificationPermission.mockResolvedValue('granted');
      mockRequestFCMToken.mockResolvedValue({
        success: true,
        token: 'test-token',
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      // First request fails
      mockRequestFCMToken.mockResolvedValueOnce({
        success: false,
        error: new Error('First error'),
      });

      // Catch error inside act() to allow React to flush state updates
      await act(async () => {
        try {
          await result.current.requestPermission();
        } catch (error) {
          // Error expected
        }
      });

      expect(result.current.error).toBeTruthy();

      // Second request succeeds
      mockRequestFCMToken.mockResolvedValueOnce({
        success: true,
        token: 'test-token',
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      // Error should now be cleared
      expect(result.current.error).toBeNull();
    });

    it('should throw error when FCM not supported', async () => {
      mockIsFCMSupported.mockReturnValue(false);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSupported).toBe(false);
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('not supported');
      });
    });
  });

  describe('revokePermission', () => {
    it('should successfully revoke FCM token', async () => {
      mockDeleteFCMToken.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Set initial token
      mockRequestNotificationPermission.mockResolvedValue('granted');
      mockRequestFCMToken.mockResolvedValue({
        success: true,
        token: 'test-token',
      });

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.token).toBe('test-token');

      // Revoke token
      await act(async () => {
        await result.current.revokePermission();
      });

      expect(mockDeleteFCMToken).toHaveBeenCalledWith('test-user-123');

      await waitFor(() => {
        expect(result.current.token).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle revoke errors gracefully', async () => {
      mockDeleteFCMToken.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Should not throw
      await act(async () => {
        await result.current.revokePermission();
      });

      expect(mockDeleteFCMToken).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should set loading state while revoking', async () => {
      mockDeleteFCMToken.mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve(undefined), 100));
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      const revokePromise = result.current.revokePermission();

      // Check loading state
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      await act(async () => {
        await revokePromise;
      });

      // After completion, should be false
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear error before revoking', async () => {
      mockDeleteFCMToken.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications(), { wrapper });

      // Set initial error
      mockRequestNotificationPermission.mockResolvedValue('denied');
      // Catch error inside act() to allow React to flush state updates
      await act(async () => {
        try {
          await result.current.requestPermission();
        } catch (error) {
          // Error expected
        }
      });

      expect(result.current.error).toBeTruthy();

      // Revoke should clear error
      await act(async () => {
        await result.current.revokePermission();
      });

      // Error should now be cleared
      expect(result.current.error).toBeNull();
    });
  });

  describe('Permission State Tracking', () => {
    it('should update permission state from Notification API', async () => {
      mockNotification.permission = 'granted';

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.permission).toBe('granted');
      });
    });

    it('should handle default permission state', async () => {
      mockNotification.permission = 'default';

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.permission).toBe('default');
      });
    });

    it('should handle denied permission state', async () => {
      mockNotification.permission = 'denied';

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await waitFor(() => {
        expect(result.current.permission).toBe('denied');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return vi.fn();
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await act(async () => {
        await result.current.revokePermission();
      });

      expect(mockDeleteFCMToken).toHaveBeenCalledWith(undefined);
    });

    it('should handle FCM token without token value', async () => {
      mockRequestNotificationPermission.mockResolvedValue('granted');
      mockRequestFCMToken.mockResolvedValue({
        success: true,
        // No token field
      });

      const { result } = renderHook(() => useNotifications(), { wrapper });

      await act(async () => {
        await result.current.requestPermission();
      });

      await waitFor(() => {
        expect(result.current.token).toBeNull();
      });
    });

    it('should handle callback updates', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const { rerender } = renderHook(
        ({ callback }) => useNotifications(callback),
        {
          wrapper,
          initialProps: { callback: callback1 },
        }
      );

      await waitFor(() => {
        expect(mockSetupForegroundMessageHandler).toHaveBeenCalled();
      });

      // Change callback
      rerender({ callback: callback2 });

      await waitFor(() => {
        // Should set up handler again with new callback
        expect(mockSetupForegroundMessageHandler).toHaveBeenCalledTimes(2);
      });
    });
  });
});
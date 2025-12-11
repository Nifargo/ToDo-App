import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAuth } from '../useAuth';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock Firebase Auth
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();

vi.mock('firebase/auth', () => ({
  signInWithPopup: (...args: unknown[]) => mockSignInWithPopup(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('@/config/firebase', () => ({
  auth: {},
  googleProvider: {},
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no user logged in
    mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null); // No user
      return vi.fn(); // Unsubscribe function
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('Context Provider', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide auth context when used within AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('signInWithGoogle');
      expect(result.current).toHaveProperty('signOut');
    });
  });

  describe('Initial State', () => {
    it('should start with loading true', () => {
      mockOnAuthStateChanged.mockImplementation(() => {
        // Don't call callback immediately
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should set loading to false after auth state is checked', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should set user when Firebase user is authenticated', async () => {
      const mockFirebaseUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      mockOnAuthStateChanged.mockImplementation((_auth, callback) => {
        callback(mockFirebaseUser);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toEqual({
          uid: 'test-uid-123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
        });
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set user to null when no Firebase user', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle auth state change errors', async () => {
      const mockError = new Error('Auth state error');

      mockOnAuthStateChanged.mockImplementation((_auth, _callback, errorCallback) => {
        errorCallback(mockError);
        return vi.fn();
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('should call Firebase signInWithPopup', async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: { uid: 'test-uid' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    });

    it('should clear error before sign in', async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: { uid: 'test-uid' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle sign in errors', async () => {
      const mockError = new Error('Sign in failed');
      mockSignInWithPopup.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Catch error inside act() to allow React to flush state updates
      await act(async () => {
        try {
          await result.current.signInWithGoogle();
        } catch (error) {
          // Error should be thrown
          expect(error).toEqual(mockError);
        }
      });

      // Error should now be set in state
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('should call Firebase signOut', async () => {
      mockSignOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('should clear error before sign out', async () => {
      mockSignOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle sign out errors', async () => {
      const mockError = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Catch error inside act() to allow React to flush state updates
      await act(async () => {
        try {
          await result.current.signOut();
        } catch (error) {
          // Error should be thrown
          expect(error).toEqual(mockError);
        }
      });

      // Error should now be set in state
      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const mockUnsubscribe = vi.fn();
      mockOnAuthStateChanged.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});

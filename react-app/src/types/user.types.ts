// User types for Firebase Auth

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface FCMTokenData {
  token: string;
  device: string;
  platform: 'web' | 'mobile' | 'desktop';
  userAgent: string;
  lastUsed: string;
  addedAt: string;
}

export interface UserSettings {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    morning: boolean;
    evening: boolean;
    dueSoon: boolean;
  };
  fcmToken?: string; // @deprecated - kept for backwards compatibility
  fcmTokens?: FCMTokenData[]; // New: array of tokens for multiple devices
  createdAt: Date;
  updatedAt: Date;
}
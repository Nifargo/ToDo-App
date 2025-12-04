// Settings types for notifications and user preferences

export interface NotificationSettings {
  enabled: boolean;
  time: string;
  notifyDueToday: boolean;
  notifyOverdue: boolean;
  notifyDueTomorrow: boolean;
}

export interface AppSettings {
  notifications: NotificationSettings;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
}
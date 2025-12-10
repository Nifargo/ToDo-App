# Firebase Cloud Messaging (FCM) Implementation

## Overview

Phase 5 (Firebase & Auth) is now 100% complete with full FCM push notification support.

## Files Created/Updated

### New Files

1. **`src/services/fcmService.ts`** - FCM Token Management Service
   - Request and manage FCM tokens
   - Save/delete tokens to/from Firestore
   - Handle token lifecycle
   - Graceful degradation when FCM not available

2. **`public/firebase-messaging-sw.js`** - Background Message Service Worker
   - Handles notifications when app is closed/background
   - Shows browser notifications
   - Handles notification click events
   - Opens app on notification click

### Updated Files

3. **`src/hooks/useNotifications.ts`** - Enhanced Notification Hook
   - Integrated with fcmService
   - Added foreground message handler
   - Added `revokePermission()` function
   - Support for custom notification callbacks
   - Better error handling

4. **`src/components/settings/NotificationSettings.tsx`** - Settings Component
   - Integrated FCM token request
   - Better error messages
   - Saves FCM token when enabling notifications

5. **`vite.config.ts`** - PWA Configuration
   - Added firebase-messaging-sw.js to assets
   - Cache Firebase SDK from CDN
   - Service worker configuration

6. **`eslint.config.js`** - ESLint Configuration
   - Added dev-dist to ignore list
   - Prevents linting generated files

## Implementation Details

### 1. FCM Token Management (`fcmService.ts`)

```typescript
// Request FCM token
const result = await requestFCMToken({
  vapidKey: 'your-vapid-key',
  userId: 'user123',
  saveToFirestore: true
});

if (result.success) {
  console.log('Token:', result.token);
}

// Delete FCM token (on sign out)
await deleteFCMToken('user123');

// Check if FCM is supported
if (isFCMSupported()) {
  // FCM available
}
```

**Key Features:**
- Automatic token persistence to Firestore
- Graceful degradation without credentials
- TypeScript strict mode compliant
- JSDoc documentation for all functions

### 2. Foreground Notifications (`useNotifications.ts`)

```typescript
// Use with custom callback
const { requestPermission, isSupported } = useNotifications((payload) => {
  toast.success(payload.notification?.title || 'New notification');
});

// Or use default browser notification behavior
const { requestPermission } = useNotifications();
```

**Features:**
- Listens for messages when app is open
- Displays browser notifications
- Optional callback for custom handling (e.g., Toast)
- Automatic cleanup on unmount

### 3. Background Notifications (`firebase-messaging-sw.js`)

**Handles:**
- Push notifications when app is closed
- Push notifications when app is in background
- Notification click actions
- Opens/focuses app on click

**Configuration:**
Service worker uses Firebase SDK from CDN. Update credentials in the file:

```javascript
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  // ...
};
```

### 4. Notification Settings UI

Users can:
- Enable/disable notifications
- Set daily reminder time
- Configure notification types:
  - Tasks due today
  - Overdue tasks
  - Tasks due tomorrow

**Workflow:**
1. User enables notifications → Browser permission prompt
2. Permission granted → FCM token requested
3. Token saved to Firestore → Settings saved
4. Backend can now send push notifications to user

## Environment Variables

Required in `.env`:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key  # Required for FCM
```

**Note:** App works WITHOUT these credentials (graceful degradation) but notifications won't function.

## Firestore Data Structure

### User Document

```typescript
{
  uid: string,
  email: string,
  fcmToken?: string,  // FCM token saved here
  notificationSettings: {
    enabled: boolean,
    time: string,
    notifyDueToday: boolean,
    notifyOverdue: boolean,
    notifyDueTomorrow: boolean,
  },
  updatedAt: string,
}
```

## Testing

### Without Firebase Credentials

1. **Dev server starts:** ✅
   ```bash
   npm run dev
   ```

2. **Build succeeds:** ✅
   ```bash
   npm run build
   ```

3. **TypeScript check passes:** ✅
   ```bash
   npm run type-check
   ```

4. **Lint passes:** ✅
   ```bash
   npm run lint
   ```

5. **App loads without errors:** ✅
   - Firebase features gracefully degrade
   - Notification settings show "not supported" message

### With Firebase Credentials

1. Add credentials to `.env`
2. Start dev server: `npm run dev`
3. Sign in with Google
4. Go to Settings → Notifications
5. Enable notifications
6. Browser prompts for permission
7. Grant permission → FCM token saved
8. Check Firestore → user document has `fcmToken` field

### Testing Push Notifications

**Foreground (app open):**
1. Send test notification from Firebase Console
2. Notification appears as browser notification

**Background (app closed/minimized):**
1. Close/minimize browser tab
2. Send test notification from Firebase Console
3. Notification appears from service worker
4. Click notification → app opens/focuses

## Send Test Notification

From Firebase Console:
1. Go to Cloud Messaging
2. Click "Send test message"
3. Enter FCM token from Firestore user document
4. Add title/body
5. Send

Or use Firebase Admin SDK (Node.js backend):

```javascript
const admin = require('firebase-admin');

await admin.messaging().send({
  token: 'user-fcm-token-from-firestore',
  notification: {
    title: 'Task Reminder',
    body: 'You have 3 tasks due today',
  },
  data: {
    url: '/',
  },
  webpush: {
    fcmOptions: {
      link: '/',
    },
  },
});
```

## Browser Compatibility

FCM requires:
- HTTPS (or localhost for development)
- Modern browser with Push API support:
  - Chrome 50+
  - Firefox 44+
  - Edge 17+
  - Safari 16+ (macOS 13+)

## Troubleshooting

### "Notifications not supported"
- Check browser compatibility
- Ensure HTTPS (except localhost)
- Check `messaging` is not null in console

### "VAPID key not configured"
- Add `VITE_FIREBASE_VAPID_KEY` to `.env`
- Get VAPID key from Firebase Console → Project Settings → Cloud Messaging

### Service worker not registering
- Check browser console for errors
- Ensure `firebase-messaging-sw.js` is in `public/` directory
- Check file is served from `/firebase-messaging-sw.js`

### Token not saving to Firestore
- Check Firestore rules allow write to `users/{uid}`
- Check browser console for errors
- Verify user is signed in

### No notifications received
- Check notification permission is granted
- Verify FCM token exists in Firestore
- Test with Firebase Console "Send test message"
- Check browser console for FCM errors

## Security Considerations

1. **VAPID Key:** Public key, safe to expose in client code
2. **FCM Token:** User-specific, stored in Firestore
3. **Firestore Rules:** Ensure users can only write their own tokens:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

4. **Server-side:** Use Firebase Admin SDK to send notifications
5. **Never:** Expose server keys or admin credentials in client code

## Future Enhancements

1. **Token Refresh:** Handle token refresh events
2. **Multiple Devices:** Support multiple FCM tokens per user
3. **Topic Subscriptions:** Subscribe users to topics
4. **Rich Notifications:** Add images, actions, badges
5. **Notification History:** Store notification log in Firestore
6. **Silent Notifications:** Background data updates

## Quality Metrics

- ✅ TypeScript strict mode: 0 errors
- ✅ ESLint: 0 warnings
- ✅ Build: Success
- ✅ Dev server: Starts without errors
- ✅ Graceful degradation: Works without credentials
- ✅ JSDoc comments: All public functions documented
- ✅ Error handling: Try/catch with user-friendly messages

## Phase 5 Completion Status

**✅ 100% Complete**

- [x] Firebase config
- [x] Auth (Google Sign-In)
- [x] AuthContext and useAuth hook
- [x] LoginScreen
- [x] Firestore real-time listeners
- [x] Offline persistence
- [x] FCM token management
- [x] Foreground message handler
- [x] Background message handler (Service Worker)
- [x] Notification settings integration
- [x] PWA configuration for FCM

**Next Phase:** Phase 6 - Task Management Features
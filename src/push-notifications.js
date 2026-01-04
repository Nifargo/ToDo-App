/**
 * Web Push Notifications Module for iOS PWA
 * Uses native Web Push API with VAPID (not Firebase Messaging)
 * Compatible with iOS 16.4+ PWA
 */

// VAPID Public Key (same as in firebase-config.js)
const VAPID_PUBLIC_KEY = 'BAx2-XuP9uTBN1yD_kw7s8FyM4yD-vkw1pI93_x0b33hCKWiF6Fmgi0LBaS-IRsuGUIP8PAMtuJiKZnUmfI2UOk';

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Check if Web Push is supported
 */
function isPushSupported() {
    return 'serviceWorker' in navigator &&
           'PushManager' in window &&
           'Notification' in window;
}

/**
 * Check if running as iOS PWA (standalone mode)
 */
function isIOSPWA() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true;
    return isIOS && isStandalone;
}

/**
 * Check if running on iOS (any mode)
 */
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

/**
 * Get iOS version
 */
function getIOSVersion() {
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
    if (match) {
        return {
            major: parseInt(match[1], 10),
            minor: parseInt(match[2], 10),
            patch: parseInt(match[3] || 0, 10)
        };
    }
    return null;
}

/**
 * Check if iOS version supports Web Push (16.4+)
 */
function isIOSPushSupported() {
    if (!isIOS()) return true; // Non-iOS always supported
    
    const version = getIOSVersion();
    if (!version) return false;
    
    // iOS 16.4+ required for Web Push
    return version.major > 16 || (version.major === 16 && version.minor >= 4);
}

/**
 * Request notification permission
 */
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('[Push] Notifications not supported');
        return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    console.log('[Push] Permission:', permission);
    return permission;
}

/**
 * Subscribe to Web Push notifications
 */
async function subscribeToPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        console.log('[Push] Service Worker ready');

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('[Push] Existing subscription found');
            return subscription;
        }

        // Create new subscription with VAPID key
        console.log('[Push] Creating new subscription...');
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        console.log('[Push] New subscription created:', subscription.endpoint);
        return subscription;

    } catch (error) {
        console.error('[Push] Subscription error:', error);
        throw error;
    }
}

/**
 * Unsubscribe from Web Push
 */
async function unsubscribeFromPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            console.log('[Push] Unsubscribed successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('[Push] Unsubscribe error:', error);
        return false;
    }
}

/**
 * Get current subscription
 */
async function getCurrentSubscription() {
    try {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    } catch (error) {
        console.error('[Push] Get subscription error:', error);
        return null;
    }
}

/**
 * Save Web Push subscription to Firestore
 */
async function saveSubscriptionToFirestore(subscription, userId) {
    if (!subscription || !userId) {
        console.warn('[Push] Missing subscription or userId');
        return false;
    }

    try {
        if (typeof firebase === 'undefined' || typeof firestore === 'undefined') {
            console.error('[Push] Firebase not initialized');
            return false;
        }

        const subscriptionData = subscription.toJSON();
        const deviceInfo = {
            platform: isIOSPWA() ? 'ios-pwa' : (isIOS() ? 'ios-safari' : 'web'),
            userAgent: navigator.userAgent,
            standalone: window.matchMedia('(display-mode: standalone)').matches,
            timestamp: Date.now()
        };

        // Save to users collection (for GitHub Actions script)
        await firestore.collection('users').doc(userId).set({
            notificationSettings: {
                enabled: true,
                webPushSubscription: subscriptionData,
                deviceInfo: deviceInfo,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            },
            // Also save as array for multiple devices support
            webPushSubscriptions: firebase.firestore.FieldValue.arrayUnion({
                subscription: subscriptionData,
                deviceInfo: deviceInfo,
                createdAt: new Date().toISOString()
            }),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('[Push] Subscription saved to Firestore');
        return true;

    } catch (error) {
        console.error('[Push] Error saving subscription:', error);
        return false;
    }
}

/**
 * Remove subscription from Firestore
 */
async function removeSubscriptionFromFirestore(userId) {
    if (!userId) return false;

    try {
        if (typeof firebase === 'undefined' || typeof firestore === 'undefined') {
            return false;
        }

        await firestore.collection('users').doc(userId).set({
            notificationSettings: {
                enabled: false,
                webPushSubscription: null,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });

        console.log('[Push] Subscription removed from Firestore');
        return true;

    } catch (error) {
        console.error('[Push] Error removing subscription:', error);
        return false;
    }
}

/**
 * Initialize Web Push notifications
 * Main entry point for the push notification system
 */
async function initializeWebPush(userId) {
    console.log('[Push] Initializing Web Push...');
    console.log('[Push] iOS:', isIOS());
    console.log('[Push] iOS PWA:', isIOSPWA());
    console.log('[Push] iOS Version:', getIOSVersion());
    console.log('[Push] Push supported:', isPushSupported());

    const result = {
        supported: false,
        permission: 'default',
        subscription: null,
        error: null,
        platform: isIOSPWA() ? 'ios-pwa' : (isIOS() ? 'ios' : 'web')
    };

    // Check basic support
    if (!isPushSupported()) {
        result.error = 'Push notifications not supported in this browser';
        console.warn('[Push]', result.error);
        return result;
    }

    // Check iOS version
    if (isIOS() && !isIOSPushSupported()) {
        result.error = 'iOS 16.4+ required for push notifications. Please update your device.';
        console.warn('[Push]', result.error);
        return result;
    }

    // Check if iOS but not in standalone mode
    if (isIOS() && !isIOSPWA()) {
        result.error = 'Add this app to Home Screen to enable notifications';
        console.warn('[Push]', result.error);
        return result;
    }

    result.supported = true;

    // Check current permission
    result.permission = Notification.permission;

    if (result.permission === 'granted') {
        try {
            result.subscription = await subscribeToPush();
            
            if (result.subscription && userId) {
                await saveSubscriptionToFirestore(result.subscription, userId);
            }
        } catch (error) {
            result.error = error.message;
        }
    }

    console.log('[Push] Init result:', result);
    return result;
}

/**
 * Request permission and subscribe
 */
async function enablePushNotifications(userId) {
    console.log('[Push] Enabling push notifications...');

    const result = {
        success: false,
        permission: 'default',
        subscription: null,
        error: null
    };

    try {
        // Request permission
        result.permission = await requestNotificationPermission();

        if (result.permission !== 'granted') {
            result.error = result.permission === 'denied' 
                ? 'Notifications blocked. Enable in browser/device settings.'
                : 'Permission not granted';
            return result;
        }

        // Subscribe to push
        result.subscription = await subscribeToPush();

        if (!result.subscription) {
            result.error = 'Failed to create subscription';
            return result;
        }

        // Save to Firestore
        if (userId) {
            await saveSubscriptionToFirestore(result.subscription, userId);
        }

        result.success = true;
        console.log('[Push] Push notifications enabled successfully');

    } catch (error) {
        console.error('[Push] Enable error:', error);
        result.error = error.message;
    }

    return result;
}

/**
 * Disable push notifications
 */
async function disablePushNotifications(userId) {
    console.log('[Push] Disabling push notifications...');

    try {
        await unsubscribeFromPush();
        
        if (userId) {
            await removeSubscriptionFromFirestore(userId);
        }

        return { success: true };

    } catch (error) {
        console.error('[Push] Disable error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send a test notification (local, not from server)
 */
async function sendLocalTestNotification() {
    if (Notification.permission !== 'granted') {
        throw new Error('Notification permission not granted');
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification('Тестова нотифікація 🎉', {
            body: 'Web Push працює! Нотифікації налаштовані правильно.',
            icon: '/ToDo-App/icons/icon-192.png',
            badge: '/ToDo-App/icons/icon-72.png',
            vibrate: [200, 100, 200],
            tag: 'test-notification',
            data: { url: '/ToDo-App/' }
        });

        console.log('[Push] Test notification sent');
        return true;

    } catch (error) {
        console.error('[Push] Test notification error:', error);
        throw error;
    }
}

// Export functions for use in app.js
window.WebPush = {
    isPushSupported,
    isIOSPWA,
    isIOS,
    isIOSPushSupported,
    getIOSVersion,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
    getCurrentSubscription,
    saveSubscriptionToFirestore,
    removeSubscriptionFromFirestore,
    initializeWebPush,
    enablePushNotifications,
    disablePushNotifications,
    sendLocalTestNotification
};

console.log('[Push] Web Push module loaded');

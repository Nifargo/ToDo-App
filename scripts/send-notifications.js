#!/usr/bin/env node

/**
 * Daily Push Notifications Script
 * Sends Web Push notifications to users with tasks due today/overdue
 * Runs via GitHub Actions on schedule
 * 
 * Compatible with iOS PWA (16.4+) via native Web Push API
 */

const admin = require('firebase-admin');
const webpush = require('web-push');

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:todo-app-notifications@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Get today's date in YYYY-MM-DD format (Kyiv timezone)
 */
function getTodayKyiv() {
  const now = new Date();
  // Kyiv is UTC+2 in winter, UTC+3 in summer
  // Using a simple offset - for production, use a proper timezone library
  const kyivTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Kiev' }));
  return kyivTime.toISOString().split('T')[0];
}

/**
 * Check if a task is due today
 */
function isDueToday(dueDate) {
  const today = getTodayKyiv();
  return dueDate === today;
}

/**
 * Check if a task is overdue
 */
function isOverdue(dueDate) {
  const today = getTodayKyiv();
  return dueDate < today;
}

/**
 * Send push notification to a subscription
 */
async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log(`✅ Notification sent to ${subscription.endpoint.substring(0, 60)}...`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send notification:`, error.message);

    // Remove invalid subscriptions (410 Gone, 404 Not Found)
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`🗑️  Subscription expired, marking for removal`);
      return { success: false, shouldRemove: true, error: error.message };
    }

    return { success: false, shouldRemove: false, error: error.message };
  }
}

/**
 * Remove expired subscription from Firestore
 */
async function removeExpiredSubscription(userId, subscriptionEndpoint) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) return;
    
    const userData = userDoc.data();
    const subscriptions = userData.webPushSubscriptions || [];
    
    // Filter out the expired subscription
    const updatedSubscriptions = subscriptions.filter(
      sub => sub.subscription?.endpoint !== subscriptionEndpoint
    );
    
    await userRef.update({
      webPushSubscriptions: updatedSubscriptions,
      'notificationSettings.enabled': updatedSubscriptions.length > 0
    });
    
    console.log(`🗑️  Removed expired subscription for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error removing subscription:`, error.message);
  }
}

/**
 * Main function to send notifications
 */
async function sendDailyNotifications() {
  console.log('═══════════════════════════════════════════');
  console.log('🚀 Starting Daily Push Notifications');
  console.log('═══════════════════════════════════════════');
  console.log(`📅 Date (Kyiv): ${getTodayKyiv()}`);
  console.log(`⏰ Time (UTC): ${new Date().toISOString()}`);
  console.log('');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`👥 Total users in database: ${usersSnapshot.size}`);
    console.log('');

    let stats = {
      usersProcessed: 0,
      usersWithSubscriptions: 0,
      usersSkipped: 0,
      notificationsSent: 0,
      notificationsFailed: 0,
      subscriptionsRemoved: 0
    };

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      console.log(`─────────────────────────────────────────`);
      console.log(`👤 Processing user: ${userId.substring(0, 20)}...`);

      // Check notification settings
      const notificationSettings = userData.notificationSettings || {};
      
      if (!notificationSettings.enabled) {
        console.log(`   ⏭️  Notifications disabled`);
        stats.usersSkipped++;
        continue;
      }

      // Get Web Push subscriptions
      // Support both old format (single subscription) and new format (array)
      let subscriptions = [];
      
      if (userData.webPushSubscriptions && Array.isArray(userData.webPushSubscriptions)) {
        subscriptions = userData.webPushSubscriptions;
      } else if (notificationSettings.webPushSubscription) {
        // Old format - single subscription
        subscriptions = [{ subscription: notificationSettings.webPushSubscription }];
      }

      if (subscriptions.length === 0) {
        console.log(`   ⏭️  No push subscriptions`);
        stats.usersSkipped++;
        continue;
      }

      stats.usersWithSubscriptions++;
      console.log(`   📱 Subscriptions: ${subscriptions.length}`);

      // Get user's incomplete tasks
      const tasksSnapshot = await db
        .collection('tasks')
        .where('userId', '==', userId)
        .where('completed', '==', false)
        .get();

      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`   📋 Incomplete tasks: ${tasks.length}`);

      // Filter tasks
      const notifyDueToday = notificationSettings.notifyDueToday !== false;
      const notifyOverdue = notificationSettings.notifyOverdue !== false;

      const dueTodayTasks = tasks.filter(task =>
        task.dueDate && isDueToday(task.dueDate) && notifyDueToday
      );

      const overdueTasks = tasks.filter(task =>
        task.dueDate && isOverdue(task.dueDate) && notifyOverdue
      );

      console.log(`   📅 Due today: ${dueTodayTasks.length}, Overdue: ${overdueTasks.length}`);

      const totalTasksToNotify = dueTodayTasks.length + overdueTasks.length;

      if (totalTasksToNotify === 0) {
        console.log(`   ⏭️  No tasks to notify about`);
        stats.usersSkipped++;
        continue;
      }

      stats.usersProcessed++;

      // Prepare notification message
      let title = 'Мої Справи 📋';
      let body = '';

      if (overdueTasks.length > 0 && dueTodayTasks.length > 0) {
        body = `⚠️ ${overdueTasks.length} прострочених, 📅 ${dueTodayTasks.length} на сьогодні`;
      } else if (overdueTasks.length > 0) {
        title = 'Прострочені завдання ⚠️';
        body = `У тебе ${overdueTasks.length} прострочених завдань`;
      } else {
        title = 'Завдання на сьогодні 📅';
        body = `У тебе ${dueTodayTasks.length} завдань на сьогодні`;
      }

      console.log(`   📤 Sending: "${title}" - "${body}"`);

      // Send to all subscriptions
      for (const subscriptionData of subscriptions) {
        const subscription = subscriptionData.subscription;

        if (!subscription || !subscription.endpoint) {
          console.log(`   ⚠️  Invalid subscription data, skipping`);
          continue;
        }

        const payload = {
          title: title,
          body: body,
          icon: '/ToDo-App/icons/icon-192.png',
          badge: '/ToDo-App/icons/icon-72.png',
          tag: 'daily-reminder',
          url: '/ToDo-App/',
          data: {
            url: '/ToDo-App/',
            userId: userId,
            taskCount: totalTasksToNotify,
            timestamp: Date.now()
          }
        };

        const result = await sendPushNotification(subscription, payload);

        if (result.success) {
          stats.notificationsSent++;
        } else {
          stats.notificationsFailed++;
          
          if (result.shouldRemove) {
            await removeExpiredSubscription(userId, subscription.endpoint);
            stats.subscriptionsRemoved++;
          }
        }
      }
    }

    // Print summary
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📊 Summary');
    console.log('═══════════════════════════════════════════');
    console.log(`   👥 Users with subscriptions: ${stats.usersWithSubscriptions}`);
    console.log(`   ✅ Users notified: ${stats.usersProcessed}`);
    console.log(`   ⏭️  Users skipped: ${stats.usersSkipped}`);
    console.log(`   📨 Notifications sent: ${stats.notificationsSent}`);
    console.log(`   ❌ Notifications failed: ${stats.notificationsFailed}`);
    console.log(`   🗑️  Subscriptions removed: ${stats.subscriptionsRemoved}`);
    console.log('═══════════════════════════════════════════');
    console.log('✅ Daily notifications completed!');

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════');
    console.error('❌ CRITICAL ERROR');
    console.error('═══════════════════════════════════════════');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
sendDailyNotifications()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

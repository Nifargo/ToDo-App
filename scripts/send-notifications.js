#!/usr/bin/env node

/**
 * Daily Push Notifications Script
 * Sends push notifications to users with tasks due today/overdue
 * Runs via GitHub Actions on schedule
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
  'mailto:your-email@example.com', // Change this to your email
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * Get today's date in YYYY-MM-DD format (Kyiv timezone)
 */
function getTodayKyiv() {
  const now = new Date();
  const kyivOffset = 2 * 60; // UTC+2 (or +3 in summer)
  const kyivTime = new Date(now.getTime() + kyivOffset * 60 * 1000);
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
    console.log(`✅ Notification sent to ${subscription.endpoint.substring(0, 50)}...`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send notification:`, error.message);

    // Remove invalid subscriptions (410 Gone, 404 Not Found)
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`🗑️  Subscription expired, should be removed`);
      return { success: false, shouldRemove: true };
    }

    return { success: false, shouldRemove: false };
  }
}

/**
 * Main function to send notifications
 */
async function sendDailyNotifications() {
  console.log('🚀 Starting daily notifications...');
  console.log(`📅 Date: ${getTodayKyiv()}`);

  try {
    // Get all users with notification settings enabled
    const usersSnapshot = await db.collection('users').get();

    let totalNotificationsSent = 0;
    let totalUsers = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Check if user has notifications enabled
      const notificationSettings = userData.notificationSettings || {};
      if (!notificationSettings.enabled) {
        console.log(`⏭️  User ${userId}: notifications disabled`);
        continue;
      }

      totalUsers++;

      // Get user's tasks
      const tasksSnapshot = await db
        .collection('tasks')
        .where('userId', '==', userId)
        .where('status', '==', 'pending')
        .get();

      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filter tasks based on notification preferences
      const dueTodayTasks = tasks.filter(task =>
        task.dueDate && isDueToday(task.dueDate) && notificationSettings.notifyDueToday
      );

      const overdueTasks = tasks.filter(task =>
        task.dueDate && isOverdue(task.dueDate) && notificationSettings.notifyOverdue
      );

      const totalTasksToNotify = dueTodayTasks.length + overdueTasks.length;

      if (totalTasksToNotify === 0) {
        console.log(`⏭️  User ${userId}: no tasks to notify`);
        continue;
      }

      // Prepare notification message
      let notificationTitle = 'Task Reminder';
      let notificationBody = '';

      if (overdueTasks.length > 0 && dueTodayTasks.length > 0) {
        notificationTitle = 'Task Reminder';
        notificationBody = `${overdueTasks.length} overdue, ${dueTodayTasks.length} due today`;
      } else if (overdueTasks.length > 0) {
        notificationTitle = 'Overdue Tasks';
        notificationBody = `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`;
      } else {
        notificationTitle = 'Tasks Due Today';
        notificationBody = `You have ${dueTodayTasks.length} task${dueTodayTasks.length > 1 ? 's' : ''} due today`;
      }

      // Send to all user's devices using Web Push subscriptions
      const webPushSubscriptions = userData.webPushSubscriptions || [];

      if (webPushSubscriptions.length === 0) {
        console.log(`⏭️  User ${userId}: no Web Push subscriptions registered`);
        continue;
      }

      console.log(`📤 User ${userId}: sending to ${webPushSubscriptions.length} device(s)`);

      for (const subscriptionData of webPushSubscriptions) {
        // Get the subscription object
        const subscription = subscriptionData.subscription;

        if (!subscription || !subscription.endpoint) {
          console.log(`⚠️  User ${userId}: invalid subscription data`);
          continue;
        }

        const payload = {
          notification: {
            title: notificationTitle,
            body: notificationBody,
            icon: '/ToDo-App/icons/icon-192.png',
            badge: '/ToDo-App/icons/icon-72.png',
            tag: 'task-notification',
            requireInteraction: false,
          },
          data: {
            url: '/ToDo-App/',
            userId,
            taskCount: totalTasksToNotify,
          },
        };

        const result = await sendPushNotification(subscription, payload);

        if (result.success) {
          totalNotificationsSent++;
        }

        // TODO: If shouldRemove, update Firestore to remove this subscription
        if (result.shouldRemove) {
          console.log(`🗑️  Should remove subscription: ${subscription.endpoint.substring(0, 50)}...`);
          // You can implement removal logic here if needed
        }
      }
    }

    console.log('\n✅ Daily notifications completed!');
    console.log(`👥 Users processed: ${totalUsers}`);
    console.log(`📨 Notifications sent: ${totalNotificationsSent}`);

  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    process.exit(1);
  }
}

// Run the script
sendDailyNotifications()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

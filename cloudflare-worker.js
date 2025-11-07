// Cloudflare Worker for sending daily task notifications via Firebase FCM

export default {
  async scheduled(event, env, ctx) {
    console.log('Cron trigger fired at:', new Date().toISOString());

    try {
      // Get current hour and today's date
      const now = new Date();
      const currentHour = now.getUTCHours();
      const today = now.toISOString().split('T')[0];

      console.log(`Current UTC hour: ${currentHour}, Date: ${today}`);

      // Get OAuth2 access token for Firebase
      const accessToken = await getAccessToken(env);

      // Fetch all users with their notification preferences
      const users = await fetchAllUsers(env, accessToken);
      console.log(`Found ${users.length} total users`);

      // Filter users whose notification time matches current hour
      const usersToNotify = filterUsersByNotificationTime(users, currentHour);
      console.log(`${usersToNotify.length} users have notifications scheduled for this hour`);

      if (usersToNotify.length === 0) {
        console.log('No users to notify at this time');
        return;
      }

      // Process each user
      for (const user of usersToNotify) {
        await processUserNotifications(env, accessToken, user, today);
      }

      console.log('All notifications sent successfully');
    } catch (error) {
      console.error('Error in scheduled worker:', error);
    }
  },

  // HTTP endpoint for manual testing
  async fetch(request, env, ctx) {
    try {
      // Trigger the same logic as cron
      await this.scheduled(null, env, ctx);
      return new Response('Notifications sent!', { status: 200 });
    } catch (error) {
      return new Response('Error: ' + error.message, { status: 500 });
    }
  }
};

// Generate OAuth2 access token from service account
async function getAccessToken(env) {
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = btoa(JSON.stringify({
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }));

  const unsignedToken = `${jwtHeader}.${jwtPayload}`;

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(env.FIREBASE_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signedToken = `${unsignedToken}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedToken}`
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Convert PEM to ArrayBuffer
function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .replace(/\s/g, '');

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Fetch all users from Firestore
async function fetchAllUsers(env, accessToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    console.error('Failed to fetch users:', response.status);
    return [];
  }

  const data = await response.json();

  if (!data.documents || data.documents.length === 0) {
    return [];
  }

  // Map to user objects
  return data.documents.map(doc => {
    const fields = doc.fields;
    return {
      userId: fields.userId?.stringValue || doc.name.split('/').pop(),
      fcmToken: fields.fcmToken?.stringValue || null,
      notificationTime: fields.notificationTime?.stringValue || '09:00' // Default to 09:00
    };
  });
}

// Filter users by notification time
// Converts notification time (HH:MM) to UTC hour and compares with current hour
function filterUsersByNotificationTime(users, currentUTCHour) {
  return users.filter(user => {
    if (!user.fcmToken) return false; // Skip users without FCM token

    // Parse user's notification time (e.g. "09:00")
    const [hours, minutes] = user.notificationTime.split(':').map(Number);

    // Assume notificationTime is in CET timezone (UTC+1 in winter, UTC+2 in summer)
    // For simplicity, we use UTC+1 (CET standard time)
    // Convert CET hour to UTC hour
    let utcHour = hours - 1; // CET is UTC+1
    if (utcHour < 0) utcHour += 24;

    return utcHour === currentUTCHour;
  });
}

// Process notifications for a single user
async function processUserNotifications(env, accessToken, user, today) {
  try {
    // Fetch tasks for this user
    const tasks = await fetchUserTasks(env, accessToken, user.userId, today);

    if (tasks.length === 0) {
      console.log(`No tasks to notify for user ${user.userId}`);
      return;
    }

    // Separate tasks into overdue and due today
    const overdueTasks = tasks.filter(t => t.dueDate < today);
    const todayTasks = tasks.filter(t => t.dueDate === today);

    // Build notification message
    let notificationBody = '';
    if (overdueTasks.length > 0 && todayTasks.length > 0) {
      notificationBody = `${overdueTasks.length} overdue, ${todayTasks.length} due today`;
    } else if (overdueTasks.length > 0) {
      notificationBody = `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`;
    } else {
      notificationBody = `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today`;
    }

    const message = {
      message: {
        token: user.fcmToken,
        notification: {
          title: `📋 Task Reminder`,
          body: notificationBody
        },
        data: {
          totalCount: tasks.length.toString(),
          overdueCount: overdueTasks.length.toString(),
          todayCount: todayTasks.length.toString(),
          date: today
        }
      }
    };

    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`;

    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      console.log(`Notification sent to user ${user.userId}: ${notificationBody}`);

      // Mark tasks as notified with today's date
      for (const task of tasks) {
        await markTaskAsNotified(env, accessToken, task.id, today);
      }
    } else {
      const error = await response.text();
      console.error(`Failed to send notification to ${user.userId}:`, error);
    }
  } catch (error) {
    console.error(`Error processing notifications for user ${user.userId}:`, error);
  }
}

// Fetch tasks for a specific user
async function fetchUserTasks(env, accessToken, userId, today) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;

  const query = {
    structuredQuery: {
      from: [{ collectionId: 'tasks' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'userId' },
                op: 'EQUAL',
                value: { stringValue: userId }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'completed' },
                op: 'EQUAL',
                value: { booleanValue: false }
              }
            }
          ]
        }
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(query)
  });

  if (!response.ok) {
    console.error(`Firestore query failed for user ${userId}:`, response.status);
    return [];
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    return [];
  }

  const tasksWithDocs = data.filter(item => item.document);

  // Map to task objects
  const allTasks = tasksWithDocs.map(item => {
    const fields = item.document.fields;
    return {
      id: item.document.name.split('/').pop(),
      userId: fields.userId.stringValue,
      text: fields.text.stringValue,
      dueDate: fields.dueDate?.stringValue || null,
      lastNotificationDate: fields.lastNotificationDate?.stringValue || null
    };
  });

  // Filter tasks: dueDate <= today, not notified today, has dueDate
  return allTasks.filter(task => {
    if (!task.dueDate) return false;
    if (task.dueDate > today) return false;
    if (task.lastNotificationDate === today) return false;
    return true;
  });
}

// Mark task as notified with today's date
async function markTaskAsNotified(env, accessToken, taskId, today) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/tasks/${taskId}?updateMask.fieldPaths=lastNotificationDate`;

  await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        lastNotificationDate: { stringValue: today }
      }
    })
  });
}
// Cloudflare Worker for sending daily task notifications via Firebase FCM

export default {
  async scheduled(event, env, ctx) {
    console.log('Cron trigger fired at:', new Date().toISOString());

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      console.log('Checking tasks for date:', today);

      // Get OAuth2 access token for Firebase
      const accessToken = await getAccessToken(env);

      // Fetch tasks from Firestore
      const tasks = await fetchTodaysTasks(env, accessToken, today);
      console.log(`Found ${tasks.length} tasks for today`);

      if (tasks.length === 0) {
        console.log('No tasks to notify about');
        return;
      }
      // Group tasks by userId
      const tasksByUser = groupTasksByUser(tasks);

      // Send notifications to each user
      for (const [userId, userTasks] of Object.entries(tasksByUser)) {
        await sendNotificationToUser(env, accessToken, userId, userTasks, today);
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

// Fetch tasks that need notification from Firestore
async function fetchTodaysTasks(env, accessToken, today) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`;

  // First, get all incomplete tasks - we'll filter by date in JavaScript
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'tasks' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'completed' },
          op: 'EQUAL',
          value: { booleanValue: false }
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
    console.error('Firestore query failed:', response.status);
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
  const tasksToNotify = allTasks.filter(task => {
    if (!task.dueDate) return false;
    if (task.dueDate > today) return false;
    if (task.lastNotificationDate === today) return false;
    return true;
  });

  return tasksToNotify;
}

// Group tasks by userId
function groupTasksByUser(tasks) {
  const grouped = {};
  for (const task of tasks) {
    if (!grouped[task.userId]) {
      grouped[task.userId] = [];
    }
    grouped[task.userId].push(task);
  }
  return grouped;
}

// Send notification to a user
async function sendNotificationToUser(env, accessToken, userId, tasks, today) {
  try {
    // Get user's FCM token
    const fcmToken = await getUserFCMToken(env, accessToken, userId);

    if (!fcmToken) {
      console.log(`No FCM token for user ${userId}`);
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
        token: fcmToken,
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
      console.log(`Notification sent to user ${userId}: ${notificationBody}`);

      // Mark tasks as notified with today's date
      for (const task of tasks) {
        await markTaskAsNotified(env, accessToken, task.id, today);
      }
    } else {
      const error = await response.text();
      console.error(`Failed to send notification to ${userId}:`, error);
    }
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
  }
}

// Get user's FCM token from Firestore
async function getUserFCMToken(env, accessToken, userId) {
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.fields?.fcmToken?.stringValue || null;
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
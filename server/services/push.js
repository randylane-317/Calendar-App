const webpush = require('web-push');
const db = require('../db');

function initWebPush() {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      `mailto:${process.env.GMAIL_USER || 'admin@calendar.local'}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log('[push] Web push initialized');
  } else {
    console.log('[push] VAPID keys not set — push notifications disabled');
  }
}

async function sendPushNotification({ userId, title, body }) {
  if (!process.env.VAPID_PUBLIC_KEY) return;

  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);
  const payload = JSON.stringify({ title, body });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err) {
      if (err.statusCode === 410) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(sub.id);
      } else {
        console.error('[push] Send error:', err.message);
      }
    }
  }
}

module.exports = { initWebPush, sendPushNotification };

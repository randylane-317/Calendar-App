const cron = require('node-cron');
const db = require('../db');
const { sendReminderEmail } = require('./email');
const { sendPushNotification } = require('./push');

function startScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      await processReminders();
    } catch (err) {
      console.error('[scheduler] Error:', err.message);
    }
  });
  console.log('[scheduler] Started — checking reminders every minute');
}

async function processReminders() {
  const now = new Date();

  const pending = db.prepare(`
    SELECT r.*,
      e.title, e.date, e.start_time,
      u.name AS user_name, u.email AS user_email
    FROM reminders r
    JOIN events e ON r.event_id = e.id
    JOIN users  u ON r.user_id  = u.id
    WHERE r.sent_at IS NULL
  `).all();

  for (const r of pending) {
    const eventStart = new Date(`${r.date}T${r.start_time || '00:00'}:00`);
    const sendAt = new Date(eventStart.getTime() - r.minutes_before * 60 * 1000);

    if (now < sendAt) continue;

    // Skip if the event started more than 1 hour ago — mark sent to stop retrying
    if (eventStart < new Date(now.getTime() - 60 * 60 * 1000)) {
      db.prepare('UPDATE reminders SET sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(r.id);
      continue;
    }

    try {
      if (r.method === 'email' && r.user_email) {
        await sendReminderEmail({
          to: r.user_email,
          name: r.user_name,
          eventTitle: r.title,
          eventDate: r.date,
          eventTime: r.start_time,
          minutesBefore: r.minutes_before,
        });
      } else if (r.method === 'push') {
        const timeLabel =
          r.minutes_before >= 1440
            ? `${Math.round(r.minutes_before / 1440)} day(s)`
            : r.minutes_before >= 60
            ? `${Math.round(r.minutes_before / 60)} hour(s)`
            : `${r.minutes_before} minute(s)`;

        await sendPushNotification({
          userId: r.user_id,
          title: `Reminder: ${r.title}`,
          body: `Coming up in ${timeLabel}${r.start_time ? ` · ${r.start_time}` : ''}`,
        });
      }

      db.prepare('UPDATE reminders SET sent_at = CURRENT_TIMESTAMP WHERE id = ?').run(r.id);
    } catch (err) {
      console.error(`[scheduler] Failed reminder ${r.id}:`, err.message);
    }
  }
}

module.exports = { startScheduler };

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

async function sendReminderEmail({ to, name, eventTitle, eventDate, eventTime, minutesBefore }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email] No config — skipping reminder to ${to}`);
    return;
  }

  const timeLabel =
    minutesBefore >= 1440
      ? `${Math.round(minutesBefore / 1440)} day(s)`
      : minutesBefore >= 60
      ? `${Math.round(minutesBefore / 60)} hour(s)`
      : `${minutesBefore} minute(s)`;

  await t.sendMail({
    from: `"Our Calendar" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Reminder: ${eventTitle} in ${timeLabel}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6366f1;margin:0 0 16px">📅 Calendar Reminder</h2>
        <p>Hi ${name},</p>
        <p>This is your reminder that <strong>${eventTitle}</strong> is coming up in <strong>${timeLabel}</strong>.</p>
        <table style="border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Date</td><td style="font-size:14px">${eventDate}</td></tr>
          ${eventTime ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Time</td><td style="font-size:14px">${eventTime}</td></tr>` : ''}
        </table>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="color:#9ca3af;font-size:12px;margin:0">You received this from Our Calendar.</p>
      </div>
    `,
  });
}

module.exports = { sendReminderEmail };

const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

function attachReminders(events) {
  return events.map(event => ({
    ...event,
    reminders: db.prepare('SELECT * FROM reminders WHERE event_id = ?').all(event.id),
  }));
}

function insertRemindersForAllUsers(eventId, reminders) {
  if (!reminders || reminders.length === 0) return;
  const users = db.prepare('SELECT id FROM users').all();
  const insert = db.prepare(
    'INSERT INTO reminders (event_id, user_id, minutes_before, method) VALUES (?, ?, ?, ?)'
  );
  for (const r of reminders) {
    for (const u of users) {
      insert.run(eventId, u.id, r.minutes_before, r.method || 'email');
    }
  }
}

// List all events
router.get('/', authenticate, (req, res) => {
  const events = db.prepare(`
    SELECT e.*,
      u.name  AS owner_name,
      u.color AS owner_color,
      cb.name AS created_by_name
    FROM events e
    LEFT JOIN users u  ON e.owner_id  = u.id
    LEFT JOIN users cb ON e.created_by = cb.id
    ORDER BY e.date ASC, e.start_time ASC
  `).all();
  res.json({ events: attachReminders(events) });
});

// Create event
router.post('/', authenticate, (req, res) => {
  const { title, date, start_time, end_time, notes, owner_id, reminders } = req.body;

  if (!title || !date) {
    return res.status(400).json({ error: 'Title and date are required' });
  }

  const result = db
    .prepare(`INSERT INTO events (title, date, start_time, end_time, notes, owner_id, created_by)
              VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(title, date, start_time || null, end_time || null, notes || null, owner_id ?? null, req.user.id);

  const newId = Number(result.lastInsertRowid);
  insertRemindersForAllUsers(newId, reminders);

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(newId);
  res.status(201).json({
    event: { ...event, reminders: db.prepare('SELECT * FROM reminders WHERE event_id = ?').all(event.id) },
  });
});

// Update event
router.put('/:id', authenticate, (req, res) => {
  const eventId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  if (!existing) return res.status(404).json({ error: 'Event not found' });

  const { title, date, start_time, end_time, notes, owner_id, reminders } = req.body;

  db.prepare(`UPDATE events
              SET title = ?, date = ?, start_time = ?, end_time = ?, notes = ?,
                  owner_id = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`)
    .run(
      title       ?? existing.title,
      date        ?? existing.date,
      start_time  !== undefined ? start_time  : existing.start_time,
      end_time    !== undefined ? end_time    : existing.end_time,
      notes       !== undefined ? notes       : existing.notes,
      owner_id    !== undefined ? owner_id    : existing.owner_id,
      eventId
    );

  if (reminders !== undefined) {
    db.prepare('DELETE FROM reminders WHERE event_id = ?').run(eventId);
    insertRemindersForAllUsers(eventId, reminders);
  }

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  res.json({
    event: { ...updated, reminders: db.prepare('SELECT * FROM reminders WHERE event_id = ?').all(eventId) },
  });
});

// Delete event
router.delete('/:id', authenticate, (req, res) => {
  const eventId = Number(req.params.id);
  if (!db.prepare('SELECT id FROM events WHERE id = ?').get(eventId)) {
    return res.status(404).json({ error: 'Event not found' });
  }
  db.prepare('DELETE FROM events WHERE id = ?').run(eventId);
  res.json({ ok: true });
});

module.exports = router;

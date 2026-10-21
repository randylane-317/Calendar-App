const router = require('express').Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// List all items — incomplete first, then oldest first
router.get('/', authenticate, (req, res) => {
  const items = db.prepare(`
    SELECT * FROM grocery_items
    ORDER BY completed ASC, created_at ASC, id ASC
  `).all();
  res.json({ items });
});

// Create item
router.post('/', authenticate, (req, res) => {
  const name = req.body.name?.trim();
  const quantity = req.body.quantity?.trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const result = db
    .prepare('INSERT INTO grocery_items (name, quantity, created_by) VALUES (?, ?, ?)')
    .run(name, quantity || null, req.user.id);

  const item = db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(Number(result.lastInsertRowid));
  res.status(201).json({ item });
});

// Delete all completed items (must be declared before /:id)
router.delete('/completed', authenticate, (req, res) => {
  const result = db.prepare('DELETE FROM grocery_items WHERE completed = 1').run();
  res.json({ ok: true, deleted: Number(result.changes) });
});

// Update item (name, quantity, completed)
router.put('/:id', authenticate, (req, res) => {
  const itemId = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(itemId);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  const { name, quantity, completed } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  db.prepare('UPDATE grocery_items SET name = ?, quantity = ?, completed = ? WHERE id = ?')
    .run(
      name      !== undefined ? name.trim()              : existing.name,
      quantity  !== undefined ? (quantity?.trim() || null) : existing.quantity,
      completed !== undefined ? (completed ? 1 : 0)      : existing.completed,
      itemId
    );

  res.json({ item: db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(itemId) });
});

// Delete item
router.delete('/:id', authenticate, (req, res) => {
  const itemId = Number(req.params.id);
  if (!db.prepare('SELECT id FROM grocery_items WHERE id = ?').get(itemId)) {
    return res.status(404).json({ error: 'Item not found' });
  }
  db.prepare('DELETE FROM grocery_items WHERE id = ?').run(itemId);
  res.json({ ok: true });
});

module.exports = router;

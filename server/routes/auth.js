const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

function issueToken(res, user) {
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

// Check if registration is still open
router.get('/setup-status', (req, res) => {
  const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get();
  res.json({ registrationOpen: count < 2, userCount: count });
});

// Register — only allowed when fewer than 2 accounts exist
router.post('/register', async (req, res) => {
  const { name, username, password, email, color } = req.body;

  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Name, username, and password are required' });
  }

  const { count } = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count >= 2) {
    return res.status(403).json({ error: 'Registration is closed — both accounts already exist' });
  }

  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase().trim())) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = db
    .prepare('INSERT INTO users (name, username, password_hash, email, color) VALUES (?, ?, ?, ?, ?)')
    .run(name.trim(), username.toLowerCase().trim(), hash, email || null, color || '#6366F1');

  const user = db
    .prepare('SELECT id, name, username, email, color FROM users WHERE id = ?')
    .get(Number(result.lastInsertRowid));

  issueToken(res, user);
  res.status(201).json({ user });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username.toLowerCase().trim());

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  issueToken(res, user);
  res.json({ user: { id: user.id, name: user.name, username: user.username, email: user.email, color: user.color } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', authenticate, (req, res) => {
  const user = db
    .prepare('SELECT id, name, username, email, color FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.get('/users', authenticate, (req, res) => {
  const users = db.prepare('SELECT id, name, username, color FROM users').all();
  res.json({ users });
});

module.exports = router;

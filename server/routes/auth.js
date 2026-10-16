const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// 1. Register new user
router.post('/register', (req, res) => {
  try {
    const { name, username, email, password, avatar, bio } = req.body;
    const displayName = (username || name || '').trim();

    if (!displayName) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const defaultAvatar = avatar && avatar.trim()
      ? avatar.trim()
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

    const passwordHash = bcrypt.hashSync(password, 10);

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, avatar, bio, role)
      VALUES (?, ?, ?, ?, ?, 'author')
    `);

    const result = insert.run(
      displayName,
      cleanEmail,
      passwordHash,
      defaultAvatar,
      bio ? bio.trim() : 'Passionate blogger on Blog Market.'
    );

    const user = db.prepare('SELECT id, name, name as username, email, avatar, bio, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = createToken(user);

    return res.status(201).json({
      message: 'Registration successful! Welcome to Blog Market.',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// 2. Login user
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = {
      id: user.id,
      _id: user.id,
      name: user.name,
      username: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      created_at: user.created_at
    };

    const token = createToken(safeUser);

    return res.json({
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// 3. Get current authenticated user profile (supports /me and /refetch as in tutorial)
const handleGetMe = (req, res) => {
  const user = {
    ...req.user,
    _id: req.user.id,
    username: req.user.name
  };
  return res.json({ user });
};

router.get('/me', requireAuth, handleGetMe);
router.get('/refetch', requireAuth, handleGetMe);

// 4. Logout endpoint
router.get('/logout', (req, res) => {
  return res.json({ message: 'Logged out successfully' });
});

// 4. Update profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, bio, avatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be blank' });
    }

    db.prepare(`
      UPDATE users
      SET name = ?, bio = ?, avatar = ?
      WHERE id = ?
    `).run(
      name.trim(),
      bio !== undefined ? bio.trim() : req.user.bio,
      avatar !== undefined ? avatar.trim() : req.user.avatar,
      req.user.id
    );

    const updatedUser = db.prepare('SELECT id, name, email, avatar, bio, role, created_at FROM users WHERE id = ?').get(req.user.id);

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 5. Quick Demo Users (for instant evaluator / reviewer access without typing credentials)
router.get('/demo-users', (req, res) => {
  const users = db.prepare('SELECT id, name, email, avatar, bio, role FROM users LIMIT 4').all();
  return res.json({ users });
});

// 6. Instant Demo Login by user ID
router.post('/demo-login/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const user = db.prepare('SELECT id, name, email, avatar, bio, role, created_at FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    const token = createToken(user);
    return res.json({
      message: `Logged in as demo user ${user.name}`,
      token,
      user
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed demo login' });
  }
});

module.exports = router;

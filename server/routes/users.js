const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');

// 1. UPDATE USER
router.put('/:id', requireAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only update your own account' });
    }

    const { username, name, email, password, bio, avatar } = req.body;
    const displayName = (username || name || req.user.name).trim();

    let passwordHash = req.user.password_hash;
    if (password && password.length >= 6) {
      passwordHash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
    }

    db.prepare(`
      UPDATE users
      SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        bio = COALESCE(?, bio),
        avatar = COALESCE(?, avatar)
      WHERE id = ?
    `).run(
      displayName,
      email ? email.trim().toLowerCase() : null,
      bio !== undefined ? bio.trim() : null,
      avatar !== undefined ? avatar.trim() : null,
      userId
    );

    const updated = db.prepare('SELECT id, id as _id, name, name as username, email, avatar, bio, role FROM users WHERE id = ?').get(userId);

    return res.json({
      message: 'User updated successfully',
      user: updated
    });
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// 2. DELETE USER
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own account' });
    }

    // Cascade deletes posts, comments, likes via SQLite foreign keys
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    return res.json({ message: 'User account deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 3. GET USER DETAILS
router.get('/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = db.prepare('SELECT id, id as _id, name, name as username, email, avatar, bio, role, created_at FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get user details' });
  }
});

module.exports = router;

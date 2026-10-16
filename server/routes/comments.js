const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

// 1. Get all comments for a specific post
router.get('/post/:postId', optionalAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const currentUserId = req.user ? req.user.id : 0;

    const comments = db.prepare(`
      SELECT 
        c.id,
        c.id AS _id,
        c.post_id,
        c.post_id AS postId,
        c.user_id,
        c.user_id AS userId,
        c.parent_id,
        c.content,
        c.content AS comment,
        c.created_at,
        c.created_at AS createdAt,
        u.name AS author,
        u.name AS author_name,
        u.avatar AS author_avatar,
        u.role AS author_role,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) AS likes_count,
        EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = ?) AS is_liked
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(currentUserId, postId);

    const formatted = comments.map(c => ({
      ...c,
      is_liked: Boolean(c.is_liked)
    }));

    return res.json({ comments: formatted, total: formatted.length });
  } catch (err) {
    console.error('Fetch comments error:', err);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Comment creation handler
const handleAddComment = (req, res) => {
  try {
    const postIdParam = req.params.postId || req.body.postId;
    const postId = parseInt(postIdParam, 10);
    const { content, comment, parent_id } = req.body;
    const commentText = (content || comment || '').trim();

    if (!commentText) {
      return res.status(400).json({ error: 'Comment content cannot be empty' });
    }
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const insert = db.prepare(`
      INSERT INTO comments (post_id, user_id, parent_id, content)
      VALUES (?, ?, ?, ?)
    `);

    const result = insert.run(
      postId,
      req.user.id,
      parent_id ? parseInt(parent_id, 10) : null,
      commentText
    );

    const newComment = db.prepare(`
      SELECT 
        c.id,
        c.id AS _id,
        c.post_id,
        c.post_id AS postId,
        c.user_id,
        c.user_id AS userId,
        c.parent_id,
        c.content,
        c.content AS comment,
        c.created_at,
        c.created_at AS createdAt,
        u.name AS author,
        u.name AS author_name,
        u.avatar AS author_avatar,
        u.role AS author_role,
        0 AS likes_count,
        0 AS is_liked
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      message: 'Comment posted successfully!',
      comment: {
        ...newComment,
        is_liked: false
      }
    });
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
};

// 2. Add comment endpoints (supports both REST /post/:postId and MERN /create)
router.post('/post/:postId', requireAuth, handleAddComment);
router.post('/create', requireAuth, handleAddComment);

// 3. Delete comment (author of comment, post owner, or admin)
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(comment.post_id);
    const isPostOwner = post && post.user_id === req.user.id;
    const isCommentOwner = comment.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isCommentOwner && !isPostOwner && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(commentId);

    return res.json({
      message: 'Comment deleted successfully',
      deletedId: commentId
    });
  } catch (err) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// 4. Toggle like on comment
router.post('/:id/like', requireAuth, (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    const comment = db.prepare('SELECT id FROM comments WHERE id = ?').get(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const existingLike = db.prepare('SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?').get(commentId, req.user.id);

    let liked = false;
    if (existingLike) {
      db.prepare('DELETE FROM comment_likes WHERE id = ?').run(existingLike.id);
      liked = false;
    } else {
      db.prepare('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)').run(commentId, req.user.id);
      liked = true;
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ?').get(commentId).count;

    return res.json({
      liked,
      likes_count: count
    });
  } catch (err) {
    console.error('Comment like error:', err);
    return res.status(500).json({ error: 'Failed to process comment like' });
  }
});

module.exports = router;

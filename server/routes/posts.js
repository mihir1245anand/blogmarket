const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// 1. Get all posts with filtering, search, sorting & stats
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search, tag, authorId, sort } = req.query;
    const currentUserId = req.user ? req.user.id : 0;

    let query = `
      SELECT 
        p.id,
        p.user_id,
        p.title,
        p.slug,
        p.excerpt,
        p.content,
        p.category,
        p.tags,
        p.cover_image,
        p.views,
        p.read_time,
        p.created_at,
        p.updated_at,
        u.name AS author_name,
        u.avatar AS author_avatar,
        u.bio AS author_bio,
        u.role AS author_role,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
        EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params = [currentUserId, currentUserId];

    if (category && category !== 'All') {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (authorId) {
      query += ` AND p.user_id = ?`;
      params.push(parseInt(authorId, 10));
    }

    if (tag) {
      query += ` AND p.tags LIKE ?`;
      params.push(`%${tag}%`);
    }

    if (search && search.trim()) {
      query += ` AND (p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ? OR p.tags LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (sort === 'popular') {
      query += ` ORDER BY likes_count DESC, p.views DESC, p.created_at DESC`;
    } else if (sort === 'comments') {
      query += ` ORDER BY comments_count DESC, p.created_at DESC`;
    } else if (sort === 'views') {
      query += ` ORDER BY p.views DESC, p.created_at DESC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    const posts = db.prepare(query).all(...params);

    // Format is_liked & is_bookmarked as true booleans
    const formatted = posts.map(post => ({
      ...post,
      is_liked: Boolean(post.is_liked),
      is_bookmarked: Boolean(post.is_bookmarked)
    }));

    return res.json({ posts: formatted, total: formatted.length });
  } catch (err) {
    console.error('Fetch posts error:', err);
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// 2. Get distinct categories and post counts
router.get('/meta/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM posts 
      GROUP BY category 
      ORDER BY count DESC
    `).all();

    const totalPosts = db.prepare('SELECT COUNT(*) as total FROM posts').get().total;

    return res.json({
      categories: [{ category: 'All', count: totalPosts }, ...categories]
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load categories' });
  }
});

// 3. Get posts bookmarked by current user
router.get('/user/bookmarked', requireAuth, (req, res) => {
  try {
    const posts = db.prepare(`
      SELECT 
        p.id, p.title, p.slug, p.excerpt, p.category, p.cover_image, p.read_time, p.created_at,
        u.name AS author_name, u.avatar AS author_avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        1 AS is_bookmarked,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS is_liked
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(req.user.id, req.user.id);

    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load bookmarks' });
  }
});

// 3b. Get posts by specific user ID (used in Profile and My Blogs in MERN tutorial)
router.get('/user/:userId', optionalAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const posts = db.prepare(`
      SELECT 
        p.*,
        p.id AS _id,
        p.content AS desc,
        p.cover_image AS photo,
        u.name AS username,
        u.name AS author_name,
        u.avatar AS author_avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(userId);

    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

// 4. Get single post by ID (and increment view count)
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.user ? req.user.id : 0;

    // Increment views
    db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(postId);

    const post = db.prepare(`
      SELECT 
        p.*,
        p.id AS _id,
        p.content AS desc,
        p.cover_image AS photo,
        u.name AS username,
        u.name AS author_name,
        u.avatar AS author_avatar,
        u.bio AS author_bio,
        u.role AS author_role,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) AS comments_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ?) AS is_liked,
        EXISTS(SELECT 1 FROM bookmarks WHERE post_id = p.id AND user_id = ?) AS is_bookmarked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(currentUserId, currentUserId, postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const categoriesArray = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [post.category];

    return res.json({
      post: {
        ...post,
        categories: categoriesArray,
        is_liked: Boolean(post.is_liked),
        is_bookmarked: Boolean(post.is_bookmarked)
      }
    });
  } catch (err) {
    console.error('Single post fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Post creation handler (compatible with both REST / and MERN /create)
const handleCreatePost = (req, res) => {
  try {
    const { title, excerpt, content, desc, category, tags, categories, cover_image, photo } = req.body;
    const bodyContent = (content || desc || '').trim();

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Post title is required' });
    }
    if (!bodyContent) {
      return res.status(400).json({ error: 'Post description / content is required' });
    }

    const cleanTitle = title.trim();
    let baseSlug = slugify(cleanTitle) || 'untitled-post';
    let uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const words = bodyContent.split(/\s+/).length;
    const readTime = Math.max(1, Math.round(words / 200));

    const cleanExcerpt = excerpt && excerpt.trim()
      ? excerpt.trim()
      : bodyContent.slice(0, 160).replace(/[#*`>]/g, '') + '...';

    let cleanCategory = category && category.trim() ? category.trim() : 'General';
    let cleanTags = tags ? tags.trim() : '';

    if (Array.isArray(categories) && categories.length > 0) {
      cleanCategory = categories[0];
      cleanTags = categories.join(', ');
    }

    const cleanCover = (cover_image || photo || '').trim() ||
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80';

    const insert = db.prepare(`
      INSERT INTO posts (user_id, title, slug, excerpt, content, category, tags, cover_image, read_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      req.user.id,
      cleanTitle,
      uniqueSlug,
      cleanExcerpt,
      bodyContent,
      cleanCategory,
      cleanTags,
      cleanCover,
      readTime
    );

    const newPost = db.prepare(`
      SELECT p.*, p.id AS _id, p.content AS desc, p.cover_image AS photo, u.name as username, u.name as author_name, u.avatar as author_avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      message: 'Article published successfully!',
      post: newPost
    });
  } catch (err) {
    console.error('Create post error:', err);
    return res.status(500).json({ error: 'Failed to create article' });
  }
};

// 5. Create new post endpoints
router.post('/create', requireAuth, handleCreatePost);
router.post('/', requireAuth, handleCreatePost);

// 6. Update existing post (requires author or admin role)
router.put('/:id', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to edit this article' });
    }

    const { title, excerpt, content, category, tags, cover_image } = req.body;

    const words = (content || existing.content).trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.round(words / 200));

    db.prepare(`
      UPDATE posts
      SET 
        title = COALESCE(?, title),
        excerpt = COALESCE(?, excerpt),
        content = COALESCE(?, content),
        category = COALESCE(?, category),
        tags = COALESCE(?, tags),
        cover_image = COALESCE(?, cover_image),
        read_time = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      excerpt ? excerpt.trim() : null,
      content ? content.trim() : null,
      category ? category.trim() : null,
      tags !== undefined ? tags.trim() : null,
      cover_image ? cover_image.trim() : null,
      readTime,
      postId
    );

    const updated = db.prepare(`
      SELECT p.*, u.name as author_name, u.avatar as author_avatar
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(postId);

    return res.json({
      message: 'Article updated successfully!',
      post: updated
    });
  } catch (err) {
    console.error('Update post error:', err);
    return res.status(500).json({ error: 'Failed to update article' });
  }
});

// 7. Delete post (requires author or admin role)
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this article' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);

    return res.json({
      message: 'Article deleted successfully',
      deletedId: postId
    });
  } catch (err) {
    console.error('Delete post error:', err);
    return res.status(500).json({ error: 'Failed to delete article' });
  }
});

// 8. Toggle like on a post
router.post('/:id/like', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(postId, req.user.id);

    let liked = false;
    if (existingLike) {
      db.prepare('DELETE FROM likes WHERE id = ?').run(existingLike.id);
      liked = false;
    } else {
      db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(postId, req.user.id);
      liked = true;
    }

    const count = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?').get(postId).count;

    return res.json({
      liked,
      likes_count: count,
      message: liked ? 'Post liked' : 'Post unliked'
    });
  } catch (err) {
    console.error('Like toggle error:', err);
    return res.status(500).json({ error: 'Failed to process like' });
  }
});

// 9. Toggle bookmark on a post
router.post('/:id/bookmark', requireAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingBookmark = db.prepare('SELECT id FROM bookmarks WHERE post_id = ? AND user_id = ?').get(postId, req.user.id);

    let bookmarked = false;
    if (existingBookmark) {
      db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existingBookmark.id);
      bookmarked = false;
    } else {
      db.prepare('INSERT INTO bookmarks (post_id, user_id) VALUES (?, ?)').run(postId, req.user.id);
      bookmarked = true;
    }

    return res.json({
      bookmarked,
      message: bookmarked ? 'Saved to your bookmarks' : 'Removed from bookmarks'
    });
  } catch (err) {
    console.error('Bookmark toggle error:', err);
    return res.status(500).json({ error: 'Failed to process bookmark' });
  }
});

module.exports = router;

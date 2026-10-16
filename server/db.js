const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const isVercel = Boolean(process.env.VERCEL);
const localDbPath = path.join(__dirname, '..', 'blog.db');
const dbPath = isVercel ? path.join('/tmp', 'blog.db') : localDbPath;

if (isVercel && !fs.existsSync(dbPath) && fs.existsSync(localDbPath)) {
  try {
    fs.copyFileSync(localDbPath, dbPath);
  } catch (e) {
    console.warn('Could not copy local db to /tmp, will initialize fresh:', e.message);
  }
}

const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for optimal performance and data integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initDatabase() {
  // 1. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      role TEXT DEFAULT 'author',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      excerpt TEXT,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT,
      cover_image TEXT,
      views INTEGER DEFAULT 0,
      read_time INTEGER DEFAULT 5,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Comments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. Post Likes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id)
    );
  `);

  // 5. Bookmarks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id)
    );
  `);

  // 6. Comment Likes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(comment_id, user_id)
    );
  `);

  // Index for fast search and relations
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
    CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post_id);
  `);

  // Check if we need to seed initial demonstration data
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('🌱 Seeding database with initial rich sample data...');

  const defaultPasswordHash = bcrypt.hashSync('password123', 10);

  // Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, avatar, bio, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'Alex Rivera',
    'alex@example.com',
    defaultPasswordHash,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    'Senior Full-Stack Architect & Open-Source Contributor. Obsessed with high-performance web systems and developer experience.',
    'admin'
  );

  insertUser.run(
    'Sarah Chen',
    'sarah@example.com',
    defaultPasswordHash,
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    'Principal Design Engineer. Exploring the intersection of human cognitive patterns, typography, and fluid micro-interactions.',
    'author'
  );

  insertUser.run(
    'Marcus Vance',
    'marcus@example.com',
    defaultPasswordHash,
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    'AI Research Engineer. Building autonomous agent systems and exploring the frontiers of reasoning models in production.',
    'author'
  );

  insertUser.run(
    'Elena Rostova',
    'elena@example.com',
    defaultPasswordHash,
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
    'Cloud Systems Specialist. Passionate about distributed SQLite, edge computing, and zero-downtime micro-deployments.',
    'author'
  );

  // Insert Posts
  const insertPost = db.prepare(`
    INSERT INTO posts (user_id, title, slug, excerpt, content, category, tags, cover_image, views, read_time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertPost.run(
    1,
    'The Renaissance of Full-Stack Architecture: Beyond Over-Engineering',
    'the-renaissance-of-full-stack-architecture',
    'How modern developer teams are shedding microservice fatigue in favor of unified, hyper-fast single-binary backends and streamlined frontend modules.',
    `### The Pendulum Swings Back

For the past decade, web development was caught in an unrelenting wave of distributed complexity. Simple dashboards required Kubernetes clusters, five distinct microservices, an event mesh, and four separate build pipelines.

In 2026, the industry is witnessing a profound course correction: **the return of lean, unified full-stack architecture**.

\`\`\`javascript
// The beauty of direct, synchronous persistence in modern runtimes
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('app.db');
const activeUsers = db.prepare('SELECT * FROM users WHERE active = 1').all();
\`\`\`

#### Why Simplicity is Winning
1. **Zero-Latency Data Fetching**: Embedded databases eliminate serialization and TCP socket overhead.
2. **Mental Clarity**: A single unified repository means unified types, atomic deployments, and instant local reproduction.
3. **Resilience**: Fewer moving parts mean dramatically reduced points of cascading failure.

> *"The fastest code is the code that doesn't have to cross a network boundary."*

When you build with clean semantic HTML, modular CSS variables, and cohesive REST APIs, you unlock performance and maintainability that outlasts fleeting framework churn.`,
    'Engineering',
    'Architecture, WebDev, Node.js, Performance',
    '/assets/hero.jpg',
    428,
    6,
    '-3 days'
  );

  insertPost.run(
    2,
    'Designing for Cognitive Flow: Micro-interactions that Elevate Web Experiences',
    'designing-for-cognitive-flow-micro-interactions',
    'A deep dive into visual rhythm, spring physics, and subtle state transitions that transform utilitarian web apps into tactile masterpieces.',
    `### The Invisible Art of Delight

Great interfaces don't merely present data; they create a sensation of physical continuity. When a user taps a heart icon or submits a comment, the screen shouldn't mechanically flicker—it should breathe.

#### The Three Tenets of Tactile UI
- **Spatial Anchoring**: Elements should emerge from where the user's attention was already focused.
- **Spring Over Easing**: Linear transitions feel robotic. Damped springs (\`cubic-bezier(0.34, 1.56, 0.64, 1)\`) mimic natural kinetic energy.
- **Immediate Optimistic Feedback**: Never make the user wait for a round-trip network response before reflecting their intent on screen.

\`\`\`css
/* Subtle kinetic button response */
.btn-interactive {
  transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.18s ease;
}
.btn-interactive:active {
  transform: scale(0.96);
}
\`\`\`

When typography pairs seamlessly with intentional contrast, reading shifts from a chore to an effortless flow state.`,
    'Design',
    'UI/UX, CSS, Animation, DesignSystems',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    312,
    5,
    '-2 days'
  );

  insertPost.run(
    3,
    'Practical Autonomous Agents: What Actually Works in Production Systems',
    'practical-autonomous-agents-in-production',
    'Cutting through the hype to examine reliable memory patterns, structured tool execution, and deterministic fallbacks in agentic applications.',
    `### Moving from Demos to Dependability

Everyone has seen agents that loop infinitely or hallucinate nonsensical tool arguments. But what does it take to deploy an agentic workflow that customers can genuinely rely on?

#### 1. Constrained Execution Windows
Rather than granting open-ended loops, production agents thrive on state machine checkpoints where every tool call produces an immutable audit log.

#### 2. Structured JSON Contracts
Eliminate free-form text parsing. Enforce strict parameter schemas on all agent capabilities:
- Explicit typing
- Bounds validation
- Contextual error reflection

\`\`\`json
{
  "tool": "publishBlogPost",
  "parameters": {
    "title": "Verified Article",
    "status": "published",
    "category": "Engineering"
  }
}
\`\`\`

#### The Future is Hybrid
The most successful systems don't replace humans—they augment specialists with intelligent assistants that handle repetitive synthesis while leaving strategic judgment in human hands.`,
    'AI & ML',
    'AI, Agents, LLM, Production',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    589,
    8,
    '-1 days'
  );

  insertPost.run(
    4,
    'The Developer Guide to Ultra-Fast Embedded SQLite Deployments',
    'developer-guide-ultra-fast-embedded-sqlite',
    'Why modern SQLite with WAL mode and native Node.js bindings can effortlessly handle hundreds of concurrent requests with sub-millisecond latencies.',
    `### Rediscovering the World's Most Deployed Database

Many developers assume SQLite is only suitable for mobile phones or toy projects. In reality, SQLite powers aircraft avionics, operating systems, and high-traffic web platforms.

With the advent of Node.js 22+ native \`node:sqlite\` module, you can perform direct in-process database queries without any external daemon or network socket.

#### Essential Optimization Checklist
- **Enable WAL Mode**: \`PRAGMA journal_mode = WAL;\` allows concurrent readers alongside a writer.
- **Enforce Foreign Keys**: \`PRAGMA foreign_keys = ON;\` to safeguard relational integrity.
- **Index High-Cardinals**: Add compound indices on query filters such as \`category\` and \`created_at\`.

Give it a shot on your next full-stack build—you will be astonished by the speed!`,
    'Database',
    'SQLite, Backend, Performance, FullStack',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    195,
    4,
    '-5 hours'
  );

  // Insert Comments
  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, user_id, parent_id, content, created_at)
    VALUES (?, ?, ?, ?, datetime('now', ?))
  `);

  insertComment.run(
    1,
    2,
    null,
    'This resonates so deeply! We spent three months wrestling with microservice service mesh configs last year before collapsing everything back into a clean modular monolith. Our latency dropped by 80%.',
    '-2 days'
  );

  insertComment.run(
    1,
    1,
    null,
    '@Sarah Chen Exactly! When the mental friction goes away, developer happiness skyrockets. Thanks for sharing that real-world experience!',
    '-1 days'
  );

  insertComment.run(
    1,
    4,
    null,
    'Great article. The native node:sqlite addition in Node.js 22+ is a true game-changer for zero-dependency full-stack deployments.',
    '-18 hours'
  );

  insertComment.run(
    2,
    3,
    null,
    'The spring physics tip is brilliant. Standard CSS cubic-bezier curves often lack that organic kinetic bounce. Adding this to our design system immediately.',
    '-1 days'
  );

  insertComment.run(
    3,
    1,
    null,
    'Structured JSON contracts are non-negotiable. Freeform regex parsing always breaks on edge cases. Super insightful breakdown, Marcus.',
    '-12 hours'
  );

  // Insert Sample Likes
  const insertLike = db.prepare(`
    INSERT OR IGNORE INTO likes (post_id, user_id)
    VALUES (?, ?)
  `);

  insertLike.run(1, 2);
  insertLike.run(1, 3);
  insertLike.run(1, 4);
  insertLike.run(2, 1);
  insertLike.run(2, 3);
  insertLike.run(3, 1);
  insertLike.run(3, 2);
  insertLike.run(3, 4);
  insertLike.run(4, 1);
  insertLike.run(4, 2);

  // Insert Sample Bookmarks
  const insertBookmark = db.prepare(`
    INSERT OR IGNORE INTO bookmarks (post_id, user_id)
    VALUES (?, ?)
  `);
  insertBookmark.run(1, 1);
  insertBookmark.run(3, 1);

  console.log('✅ Database seeded successfully!');
}

module.exports = {
  db,
  initDatabase
};

# ⚡ Blog Market — Full-Stack Blog Platform with Comments

A full-stack web application designed and built based on the tutorial **"Building a Full-Stack MERN Blog Application from Scratch"** by **FullStack Snehasish** ([Watch Task Tutorial on YouTube](https://www.youtube.com/watch?v=zuye-dYSkS0)).

Featuring **JWT authentication**, **2-column `HomePosts` layout**, **interactive comment threads**, **dynamic category tag creation with removable pills**, **post author editing & deletion permissions**, **user profiles**, **search functionality**, and **zero-configuration native SQLite persistence**.

![Blog Market Platform Preview](/assets/hero.jpg)

---

## 📑 Video Tutorial Alignment & Component Architecture

This project replicates the structure, layout, and user flows taught in the video walkthrough:

| Video Timestamp & Section | Implemented View / Component | Description & Key Capabilities |
| :--- | :--- | :--- |
| **05:00 — Navbar Design** | `Navbar` (`public/index.html`) | **"Blog Market"** brand logo, search input (`Search a post...`), `Write` link (`#/write`), `Login` / `Register` links for guests, user profile menu (`Profile`, `Write`, `My blogs`, `Logout`), and quick 1-click **Demo Accounts** menu. |
| **13:47 — Home Posts** | `HomePosts` (`#/`) | 2-Column layout: Left side image (**35%** width), Right side post title, author info (`@username` + date/time `DD/MM/YYYY HH:mm`), and description snippet with `...Read more`. |
| **20:32 — Footer Design** | `Footer` (`public/index.html`) | 4-column responsive footer: Featured Blogs, Community & Support, Privacy & Terms, and copyright `@Blog Market 2023-2026`. |
| **25:50 — Login & Register** | `Login` (`#/login`) & `Register` (`#/register`) | Dedicated centered cards: *"Log in to your account"* and *"Create an account"*, username, email, password fields, cross-links, and 1-click demo login buttons. |
| **36:40 — Post Details Page** | `PostDetails` (`#/posts/post/:id`) | Full post reader view with large headline, **Edit (pencil)** and **Delete (trash)** action icons (only rendered for the post author), `@author`, date/time, big cover image, full article description, and category badges. |
| **52:55 — Create Post Page** | `CreatePost` (`#/write`) | Heading *"Create a post"*, title input, file upload (`multer`) + visual presets, category input with **"Add"** button creating removable tag pills (`x`), description textarea, and **"Create"** button. |
| **1:09:59 — Edit Post Page** | `EditPost` (`#/edit/:id`) | Heading *"Update a post"*, pre-filled title, image selector, category pills with `x` delete, description, and **"Update"** button. |
| **1:11:59 — Profile Page** | `Profile` (`#/profile`) | 2-Column layout: Profile management form on the left (username, email, password update, delete account button), and **"Your posts:"** list on the right. |
| **4:51:47 — Comments Section** | `Comments` (`#/posts/post/:id`) | Comment stream under each post: displays `@author`, date/time, comment text, and **Delete (trash)** icon for comment authors. Includes *"Write a comment"* input field and *"Add Comment"* button. |
| **5:34:20 — My Blogs Page** | `MyBlogs` (`#/myblogs`) | Dedicated page listing all articles authored by the currently logged-in user with direct edit/delete shortcuts. |

---

## 🌟 Key Features

### 1. 🔐 User Registration, Login & Authentication
- **Secure Password Hashing**: Utilizes `bcryptjs` for encryption and stateless `jsonwebtoken` (JWT) for authentication.
- **Session Persistence**: Auto-hydrates user sessions from `localStorage` upon page refresh.
- **1-Click Demo Accounts**: Test immediately without manual typing:
  - **Alex Rivera** (`alex@example.com` / `password123`) — Full-Stack Architect *(Admin)*
  - **Sarah Chen** (`sarah@example.com` / `password123`) — Principal Product Designer *(Author)*
  - **Marcus Vance** (`marcus@example.com` / `password123`) — AI Research Engineer *(Author)*
  - **Elena Rostova** (`elena@example.com` / `password123`) — Cloud Systems *(Author)*
- **User Profile Management**: Update display names, email addresses, and passwords, or delete accounts with full cascade clean-up.

### 2. 📝 Blog Posts Management (CRUD)
- **Create Articles**: Draft publications with title, custom category selector, tags, auto-calculated read time, and excerpt.
- **Image File Uploads & Presets**: Upload custom images via `multer` or choose from high-resolution curated presets.
- **Dynamic Category Tags**: Type any category and click **"Add"** to generate removable badges with `x` removal buttons.
- **Author Permissions**: Only the original creator of a post (or an admin) can access Edit and Delete controls.
- **Real-Time Search & Category Filters**: Search across titles and content, or filter via category pills with live post counts.

### 3. 💬 Interactive Comments Section
- **Discussion Stream**: Real-time conversation thread under every post with author tags and timestamps.
- **Posting Comments**: Instant optimistic updates with author username and date.
- **Comment Deletion**: Comment authors can delete their own comments with one click.
- **Likes & Bookmarks**: Dynamic heart burst animations with reactive counters.

### 4. 🗄️ Backend RESTful APIs & Embedded Persistence
- **High-Performance Native SQLite**: Powered by Node.js 24's native `DatabaseSync` (`blog.db`), running in WAL mode with foreign key constraints. Zero external database daemon dependencies or configuration hurdles.
- **Dual API Compatibility**: Endpoints support both standard RESTful paths and the exact routes from the MERN video tutorial (e.g. `/api/posts/create`, `/api/comments/create`, `/api/posts/user/:userId`).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v22.5.0 or higher (Node.js 24 is verified and supported)
- **NPM**: v10 or higher

### Installation & Launch

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```
   *Or for development auto-reload:*
   ```bash
   npm run dev
   ```

3. **Open the Web Application**:
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

---

## 🔑 Seeded Demo Accounts (Pre-configured for Instant Testing)

All seeded demo accounts share the password: `password123`. Click the **"Demo Accounts ▾"** button in the navbar for 1-click login!

| Name / Username | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Alex Rivera** | Lead Architect (Admin) | `alex@example.com` | `password123` |
| **Sarah Chen** | Product Designer | `sarah@example.com` | `password123` |
| **Marcus Vance** | AI Research Engineer | `marcus@example.com` | `password123` |
| **Elena Rostova** | Cloud Systems Specialist | `elena@example.com` | `password123` |

---

## 📡 RESTful API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account (`username`, `email`, `password`) | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/auth/refetch` | Re-fetch logged-in user profile | Yes |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Yes |
| `GET` | `/api/auth/logout` | Log out session | No |
| `GET` | `/api/auth/demo-users`| List available demo accounts | No |
| `POST` | `/api/auth/demo-login/:id`| 1-click login as demo account | No |

### Blog Posts (`/api/posts`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | List all posts (filters: `?search=`, `?category=`, `?sort=`) | Optional |
| `GET` | `/api/posts/:id` | Get single post details (increments view count) | Optional |
| `GET` | `/api/posts/user/:userId` | Get all posts authored by a specific user | Optional |
| `POST` | `/api/posts/create` | Create new post (`title`, `desc`, `photo`, `categories`) | Yes |
| `POST` | `/api/posts` | Create new post (standard REST alias) | Yes |
| `PUT` | `/api/posts/:id` | Update post (author/admin only) | Yes |
| `DELETE` | `/api/posts/:id` | Delete post and cascade comments (author/admin only) | Yes |
| `POST` | `/api/posts/:id/like` | Toggle like on post | Yes |
| `POST` | `/api/posts/:id/bookmark` | Toggle bookmark on post | Yes |
| `GET` | `/api/posts/meta/categories` | Get category breakdown & post counts | No |

### Comments (`/api/comments`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/comments/post/:postId` | Get all comments for a post | Optional |
| `POST` | `/api/comments/create` | Create comment (`comment`, `author`, `postId`, `userId`) | Yes |
| `POST` | `/api/comments/post/:postId` | Create comment (REST alias) | Yes |
| `DELETE` | `/api/comments/:id` | Delete comment (author/post owner only) | Yes |
| `POST` | `/api/comments/:id/like` | Upvote/like a comment | Yes |

### Users (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `PUT` | `/api/users/:id` | Update user profile (`username`, `email`, `password`) | Yes |
| `DELETE` | `/api/users/:id` | Delete user account and cascade data | Yes |
| `GET` | `/api/users/:id` | Get user details | No |

### Uploads (`/api/upload`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/upload` | Upload image file using Multer | Yes |
| `GET` | `/api/upload/presets` | Get curated cover artwork presets | No |

---

## 📁 Project Directory Structure

```
blog-platform/
├── package.json               # Project manifest, dependencies, and npm scripts
├── .env                       # Environment variables (PORT=5000, JWT_SECRET)
├── blog.db                    # Native SQLite database (auto-generated & seeded)
├── README.md                  # Comprehensive project documentation
├── server/
│   ├── index.js               # Express server entry point & static serving
│   ├── db.js                  # Native SQLite schema & rich sample data seeder
│   ├── middleware/
│   │   └── auth.js            # JWT verification & optional auth middleware
│   └── routes/
│       ├── auth.js            # User authentication routes (/register, /login, /refetch)
│       ├── users.js           # User management routes (update, delete, details)
│       ├── posts.js           # Posts CRUD, user posts, search, and likes
│       ├── comments.js        # Comments discussion and deletion routes
│       └── upload.js          # Multer file upload & curated presets
├── public/
│   ├── index.html             # Main Single Page App (Navbar, HomePosts, PostDetails, Forms)
│   ├── css/
│   │   └── styles.css         # Modern design system, 2-column cards & dark/light themes
│   ├── js/
│   │   ├── api.js             # Client API service & token manager
│   │   └── app.js             # Client-side router, view switcher & state controller
│   └── assets/
│       └── hero.jpg           # High-resolution hero artwork
└── uploads/                   # User-uploaded article cover images
```

---

## 🧭 Step-by-Step Exploration Guide

1. Open **[http://localhost:5000](http://localhost:5000)** in your browser.
2. **Log In as a Demo Account**: Click **"Demo Accounts ▾"** in the top navigation bar and select **Sarah Chen** or **Alex Rivera**.
3. **Browse & Search**: Enter a term in the **"Search a post..."** input in the navbar or click any category pill (*Engineering*, *Design*, *AI & ML*, etc.).
4. **Read Post & View Comments**: Click any post on the homepage to open `#/posts/post/:id`. You can view author information, timestamps, and the full comment stream.
5. **Add a Comment**: Scroll to the comments section, write your comment, and click **"Add Comment"**. Notice how your comment appears with author badge and delete option.
6. **Create a New Post (`#/write`)**:
   - Click the **"Write"** link in the navbar.
   - Enter a title.
   - Type a category and click **"Add"** to see dynamic tag pills appear with `x` delete buttons.
   - Enter your post description and click **"Create"**.
7. **View Your Profile & Blogs**: Open the user menu at the top right to access **"Profile"** or **"My blogs"**.

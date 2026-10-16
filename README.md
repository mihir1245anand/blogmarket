# ⚡ Blog Market — Full-Stack Blog Platform with Interactive Comments

A modern, high-performance full-stack blogging web application featuring user registration and authentication, complete post content management (CRUD), interactive comment discussion threads, search functionality, category tagging, and zero-configuration native SQLite persistence.

![Blog Market Platform Preview](/assets/hero.jpg)

---

## 🌟 Key Features

### 1. 🔐 User Registration, Login & Authentication
- **Secure Password Hashing**: Utilizes `bcryptjs` for encryption and stateless `jsonwebtoken` (JWT) for authentication.
- **Session Persistence**: Automatic token management in `localStorage` with silent profile re-hydration upon page refresh.
- **1-Click Demo Accounts**: Test immediately without manual credentials entry:
  - **Alex Rivera** (`alex@example.com` / `password123`) — Full-Stack Architect *(Admin)*
  - **Sarah Chen** (`sarah@example.com` / `password123`) — Principal Product Designer *(Author)*
  - **Marcus Vance** (`marcus@example.com` / `password123`) — AI Research Engineer *(Author)*
  - **Elena Rostova** (`elena@example.com` / `password123`) — Cloud Systems *(Author)*
- **User Profile Management**: Update username, email address, password, or delete account with cascading data clean-up.

### 2. 📝 Blog Posts Management (CRUD)
- **Create Articles**: Draft publications with title, custom category selector, tags, auto-calculated read time, and description.
- **Image File Uploads & Presets**: Upload custom images via `multer` or choose from high-resolution curated presets.
- **Dynamic Category Tags**: Type any category and click **"Add"** to generate removable badges with `x` deletion buttons.
- **Author Permissions**: Only the original creator of a post (or an admin) can access Edit and Delete controls.
- **Real-Time Search & Category Filters**: Search across titles and content, or filter via category pills with live post counts.
- **2-Column Card Layout**: Responsive home feed displaying a 35% width image column alongside title, author `@username`, timestamp, and excerpt.

### 3. 💬 Interactive Comments & Discussions
- **Discussion Stream**: Real-time conversation thread under every post displaying author tags, relative timestamps, and content.
- **Posting Comments**: Instant optimistic updates with author username and date.
- **Comment Deletion**: Comment authors can delete their own comments with one click.
- **Likes & Bookmarks**: Dynamic heart burst animations with reactive counters.

### 4. 🎨 Modern Design & User Experience
- **Theme Modes**: Seamless toggle between dark and light themes with persistence.
- **Clean Typography**: Styled with Google Fonts for crisp reading and user interface elements.
- **Single Page Application (SPA)**: Client-side routing (`#/`, `#/posts/post/:id`, `#/write`, `#/edit/:id`, `#/profile`, `#/myblogs`, `#/login`, `#/register`) without full-page reloads.

### 5. 🗄️ Backend Architecture & Persistence
- **High-Performance Native SQLite**: Powered by Node.js 24's native `DatabaseSync` (`blog.db`), running in WAL mode with foreign key constraints. Zero external database daemon dependencies or configuration hurdles.
- **RESTful Endpoints**: Clean status codes, structured JSON error handling, and modular controllers.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js (v24), Express 5, CORS, Dotenv |
| **Database** | Embedded SQLite (`node:sqlite`) with WAL mode & Foreign Keys |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **File Uploads** | Multer disk storage |
| **Frontend** | Vanilla HTML5, CSS3 (Custom Properties & Glassmorphism), ES6+ JavaScript modules |

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
   Navigate your browser to:
   ```
   http://localhost:5000
   ```

---

## 🔑 Demo Accounts (Pre-configured for Instant Testing)

All seeded demo accounts share the password: `password123`. You can also click the **"Demo Accounts ▾"** button in the top navigation bar for 1-click instant login!

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
| `GET` | `/api/posts` | List all posts (supports `?search=`, `?category=`, `?sort=`) | Optional |
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
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules for node_modules, env & sqlite
├── blog.db                    # Native SQLite database (auto-generated & seeded)
├── README.md                  # Project documentation
├── server/
│   ├── index.js               # Express server entry point & static serving
│   ├── db.js                  # Native SQLite schema & sample data seeder
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
│   │   └── styles.css         # Modern design system, 2-column cards & themes
│   ├── js/
│   │   ├── api.js             # Client API service & token manager
│   │   └── app.js             # Client-side router, view switcher & state controller
│   └── assets/
│       └── hero.jpg           # High-resolution hero artwork
└── uploads/                   # User-uploaded article cover images
```

---

## 🧭 Application Views & Navigation

1. **Home Feed (`#/`)**: Browse published posts in a 2-column card layout, filter by category tags, or search keywords.
2. **Post Details (`#/posts/post/:id`)**: Read complete articles with author details, timestamps, and full comment discussion threads.
3. **Create Post (`#/write`)**: Publish new posts with title, image upload, category tags with removable pills, and description.
4. **Edit Post (`#/edit/:id`)**: Modify existing articles (authorized for post authors).
5. **User Profile (`#/profile`)**: Update username, email, password, and view all authored publications.
6. **My Blogs (`#/myblogs`)**: Direct management view for posts authored by the logged-in user.
7. **Authentication (`#/login` & `#/register`)**: User sign-in and account registration.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

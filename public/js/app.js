/**
 * BLOG MARKET - Frontend Application Controller & Router
 * Faithful reproduction of FullStack Snehasish's MERN Blog Application tutorial.
 */

// Global State
const state = {
  posts: [],
  categories: [],
  activeCategory: 'All',
  searchQuery: '',
  activeSort: 'latest',
  activePost: null,
  activeComments: [],
  createCategories: [],
  editCategories: [],
  selectedCoverUrl: '/assets/hero.jpg'
};

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

  toast.innerHTML = `
    <span style="font-weight: 700; font-size: 1.1rem;">${icon}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPostDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const pad = (n) => String(n).padStart(2, '0');
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y = date.getFullYear();
  const hours = pad(date.getHours());
  const mins = pad(date.getMinutes());
  return `${d}/${m}/${y} ${hours}:${mins}`;
}

// ==========================================================================
// ROUTER & VIEW SWITCHER
// ==========================================================================
function navigateTo(hash) {
  window.location.hash = hash;
}

function router() {
  const hash = window.location.hash || '#/';
  const views = document.querySelectorAll('.page-view');
  views.forEach(v => v.style.display = 'none');

  window.scrollTo(0, 0);

  if (hash === '#/' || hash === '' || hash.startsWith('#/?')) {
    document.getElementById('view-home').style.display = 'block';
    loadCategories();
    loadHomePosts();
  } else if (hash.startsWith('#/posts/post/')) {
    const postId = hash.split('#/posts/post/')[1];
    document.getElementById('view-post-details').style.display = 'block';
    loadPostDetails(postId);
  } else if (hash === '#/write') {
    if (!window.api.isAuthenticated()) {
      showToast('Please login to create a post', 'info');
      navigateTo('#/login');
      return;
    }
    document.getElementById('view-create-post').style.display = 'block';
    initCreatePostView();
  } else if (hash.startsWith('#/edit/')) {
    const postId = hash.split('#/edit/')[1];
    if (!window.api.isAuthenticated()) {
      showToast('Please login to edit this post', 'info');
      navigateTo('#/login');
      return;
    }
    document.getElementById('view-edit-post').style.display = 'block';
    initEditPostView(postId);
  } else if (hash === '#/login') {
    document.getElementById('view-login').style.display = 'block';
    loadDemoUsersList();
  } else if (hash === '#/register') {
    document.getElementById('view-register').style.display = 'block';
  } else if (hash === '#/profile') {
    if (!window.api.isAuthenticated()) {
      navigateTo('#/login');
      return;
    }
    document.getElementById('view-profile').style.display = 'block';
    initProfileView();
  } else if (hash === '#/myblogs') {
    if (!window.api.isAuthenticated()) {
      navigateTo('#/login');
      return;
    }
    document.getElementById('view-myblogs').style.display = 'block';
    initMyBlogsView();
  } else {
    document.getElementById('view-home').style.display = 'block';
    loadHomePosts();
  }

  updateAuthUI();
}

window.addEventListener('hashchange', router);

// ==========================================================================
// AUTHENTICATION UI
// ==========================================================================
function updateAuthUI() {
  const guestActions = document.getElementById('nav-guest-actions');
  const userActions = document.getElementById('nav-user-actions');
  const userAvatar = document.getElementById('current-user-avatar');
  const userName = document.getElementById('current-user-name');
  const demoPill = document.getElementById('demo-account-pill');

  const user = window.api.getCurrentUser();

  if (user) {
    if (guestActions) guestActions.style.display = 'none';
    if (userActions) userActions.style.display = 'flex';
    if (userAvatar) userAvatar.src = user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user';
    if (userName) userName.textContent = user.username || user.name;
    if (demoPill) demoPill.textContent = `Demo: ${(user.username || user.name).split(' ')[0]}`;
  } else {
    if (guestActions) guestActions.style.display = 'flex';
    if (userActions) userActions.style.display = 'none';
    if (demoPill) demoPill.textContent = 'Demo Accounts ▾';
  }
}

async function handleLogoutUser() {
  window.api.logout();
  showToast('Logged out successfully', 'info');
  navigateTo('#/login');
}

async function loadDemoUsersList() {
  const containers = [
    document.getElementById('demo-dropdown-list'),
    document.getElementById('demo-users-page-container')
  ];

  try {
    const data = await window.api.getDemoUsers();
    containers.forEach(container => {
      if (!container) return;
      container.innerHTML = data.users.map(u => `
        <div class="demo-user-chip" onclick="handleDemoLogin(${u.id})">
          <img src="${u.avatar}" alt="${escapeHtml(u.name)}" />
          <span>${escapeHtml(u.name)} (${escapeHtml(u.role)})</span>
        </div>
      `).join('');
    });
  } catch (err) {
    console.error('Failed to load demo accounts', err);
  }
}

async function handleDemoLogin(userId) {
  try {
    const data = await window.api.demoLogin(userId);
    const demoDropdown = document.getElementById('demo-dropdown');
    if (demoDropdown) demoDropdown.classList.remove('active');
    showToast(`Logged in as demo user ${data.user.name}!`, 'success');
    navigateTo('#/');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================================================
// HOME PAGE (HomePosts: 2-Column Cards from Tutorial)
// ==========================================================================
async function loadCategories() {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  try {
    const data = await window.api.getCategories();
    state.categories = data.categories;

    container.innerHTML = state.categories.map(c => `
      <button class="category-pill ${state.activeCategory === c.category ? 'active' : ''}" 
              onclick="filterCategory('${escapeHtml(c.category)}')">
        <span>${escapeHtml(c.category)}</span>
        <span class="pill-count">${c.count}</span>
      </button>
    `).join('');
  } catch (err) {
    console.error('Failed loading categories', err);
  }
}

function filterCategory(category) {
  state.activeCategory = category;
  loadCategories();
  loadHomePosts();
}

async function loadHomePosts() {
  const container = document.getElementById('home-posts-list');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 4rem 1rem;">
      <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 1rem; color: var(--text-muted); font-size: 0.9rem;">Loading posts...</p>
    </div>
  `;

  try {
    const data = await window.api.getPosts({
      category: state.activeCategory,
      search: state.searchQuery,
      sort: state.activeSort
    });

    state.posts = data.posts;
    renderHomePosts(state.posts);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-state-title">Unable to Load Posts</h3>
        <p class="empty-state-desc">${escapeHtml(err.message)}</p>
        <button class="btn btn-secondary" onclick="loadHomePosts()">Try Again</button>
      </div>
    `;
  }
}

function renderHomePosts(posts) {
  const container = document.getElementById('home-posts-list');
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✍️</div>
        <h3 class="empty-state-title">No Posts Available</h3>
        <p class="empty-state-desc">No posts found matching your search. Be the first to publish a post on Blog Market!</p>
        <button class="btn btn-primary" onclick="navigateTo('#/write')">Write a Post</button>
      </div>
    `;
    return;
  }

  // Exact 2-Column HomePosts Layout from YouTube Tutorial (Photo Left 35%, Details Right 65%)
  container.innerHTML = posts.map(post => {
    const descText = post.desc || post.content || post.excerpt || '';
    const snippet = descText.length > 200 ? descText.slice(0, 200) + '...Read more' : descText;
    const authorUsername = post.username || post.author_name || 'author';

    return `
      <div class="home-post-row" onclick="navigateTo('#/posts/post/${post.id}')">
        <!-- Left Column: Photo (35% width) -->
        <div class="home-post-img-col">
          <img src="${post.photo || post.cover_image || '/assets/hero.jpg'}" alt="${escapeHtml(post.title)}" class="home-post-img" loading="lazy">
        </div>

        <!-- Right Column: Details (65% width) -->
        <div class="home-post-details-col">
          <h2 class="home-post-title">${escapeHtml(post.title)}</h2>
          
          <div class="home-post-author-row">
            <span class="home-post-author-name">@${escapeHtml(authorUsername)}</span>
            <span>${formatPostDate(post.created_at)}</span>
          </div>

          <p class="home-post-desc">${escapeHtml(snippet)}</p>

          <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
            <span style="background: rgba(99,102,241,0.1); color: var(--accent-primary); padding: 2px 8px; border-radius: 999px; font-weight: 600;">
              ${escapeHtml(post.category)}
            </span>
            <div style="display: flex; gap: 1rem;">
              <span>💬 ${post.comments_count || 0} comments</span>
              <span>❤️ ${post.likes_count || 0} likes</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// POST DETAILS PAGE (Title with Edit/Delete icons, Big Photo, Comments)
// ==========================================================================
async function loadPostDetails(postId) {
  const container = document.getElementById('post-details-container');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 5rem 1rem;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 1rem; color: var(--text-muted);">Loading post details...</p>
    </div>
  `;

  try {
    const data = await window.api.getPostById(postId);
    state.activePost = data.post;
    renderPostDetailsView(state.activePost);
    await loadCommentsForPostView(postId);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-state-title">Post Not Found</h3>
        <p class="empty-state-desc">${escapeHtml(err.message)}</p>
        <button class="btn btn-secondary" onclick="navigateTo('#/')">Back to Home</button>
      </div>
    `;
  }
}

function renderPostDetailsView(post) {
  const container = document.getElementById('post-details-container');
  if (!container) return;

  const currentUser = window.api.getCurrentUser();
  const isAuthor = currentUser && (currentUser.id === post.user_id || currentUser.role === 'admin');
  const authorUsername = post.username || post.author_name || 'author';
  const categoriesList = post.categories || (post.tags ? post.tags.split(',').map(t => t.trim()) : [post.category]);

  container.innerHTML = `
    <!-- Top Header: Title and Edit/Delete Icons (Exact Tutorial Layout) -->
    <div class="post-detail-header-row">
      <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
      
      ${isAuthor ? `
        <div class="post-detail-actions">
          <button class="icon-action-btn" title="Edit Post" onclick="navigateTo('#/edit/${post.id}')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="icon-action-btn delete-icon" title="Delete Post" onclick="handleDeletePost(${post.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      ` : ''}
    </div>

    <!-- Author & Date Row -->
    <div class="post-detail-meta-row">
      <span style="font-weight: 700; color: var(--accent-primary);">@${escapeHtml(authorUsername)}</span>
      <span>${formatPostDate(post.created_at)}</span>
    </div>

    <!-- Big Centered Cover Photo -->
    <img src="${post.photo || post.cover_image || '/assets/hero.jpg'}" alt="${escapeHtml(post.title)}" class="post-detail-cover-img">

    <!-- Post Content Paragraphs -->
    <div class="article-prose" style="font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">
      <p style="white-space: pre-wrap;">${escapeHtml(post.desc || post.content)}</p>
    </div>

    <!-- Post Categories Tags Row -->
    <div class="post-categories-row">
      <span style="font-weight: 700; font-size: 0.9rem; margin-right: 0.5rem;">Categories:</span>
      ${categoriesList.map(cat => `<span class="post-category-badge">${escapeHtml(cat)}</span>`).join('')}
    </div>

    <!-- Comments Section (Exact Tutorial Layout) -->
    <div class="comments-section-wrap">
      <h3 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 1.5rem;">Comments</h3>

      <!-- Existing Comments List -->
      <div id="post-view-comments-list"></div>

      <!-- Add Comment Input Bar -->
      <div class="comment-add-bar">
        <input type="text" id="post-view-comment-input" class="comment-add-input" placeholder="Write a comment">
        <button type="button" class="btn btn-primary" onclick="handleAddCommentInView(${post.id})">Add Comment</button>
      </div>
    </div>
  `;
}

async function loadCommentsForPostView(postId) {
  const container = document.getElementById('post-view-comments-list');
  if (!container) return;

  container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">Loading comments...</p>`;

  try {
    const data = await window.api.getComments(postId);
    state.activeComments = data.comments;

    if (data.comments.length === 0) {
      container.innerHTML = `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border: 1px dashed var(--border-subtle); border-radius: var(--radius-sm); text-align: center; color: var(--text-muted); font-size: 0.9rem;">
          No comments yet! Be the first to comment above.
        </div>
      `;
      return;
    }

    const currentUser = window.api.getCurrentUser();

    container.innerHTML = data.comments.map(c => {
      const isCommentAuthor = currentUser && (currentUser.id === (c.userId || c.user_id) || currentUser.role === 'admin');
      const authorName = c.author || c.author_name || 'user';

      return `
        <div class="comment-card-tutorial" id="comment-card-${c.id || c._id}">
          <div class="comment-card-top-row">
            <span class="comment-card-author">@${escapeHtml(authorName)}</span>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span class="comment-card-date">${formatPostDate(c.createdAt || c.created_at)}</span>
              ${isCommentAuthor ? `
                <button onclick="handleDeleteCommentInView(${c.id || c._id}, ${postId})" style="color: var(--text-muted); cursor: pointer;" title="Delete Comment">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              ` : ''}
            </div>
          </div>
          <p style="color: var(--text-primary); font-size: 0.95rem; line-height: 1.5; margin: 0;">
            ${escapeHtml(c.comment || c.content)}
          </p>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p style="color: var(--accent-rose);">Failed to load comments: ${escapeHtml(err.message)}</p>`;
  }
}

async function handleAddCommentInView(postId) {
  if (!window.api.isAuthenticated()) {
    showToast('Please login to post a comment', 'info');
    navigateTo('#/login');
    return;
  }

  const input = document.getElementById('post-view-comment-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text) {
    showToast('Please write a comment', 'error');
    return;
  }

  try {
    await window.api.addComment(postId, text);
    input.value = '';
    showToast('Comment added successfully!', 'success');
    await loadCommentsForPostView(postId);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDeleteCommentInView(commentId, postId) {
  if (!confirm('Are you sure you want to delete this comment?')) return;

  try {
    await window.api.deleteComment(commentId);
    showToast('Comment deleted', 'info');
    await loadCommentsForPostView(postId);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDeletePost(postId) {
  if (!confirm('Are you sure you want to delete this post?')) return;

  try {
    await window.api.deletePost(postId);
    showToast('Post deleted successfully', 'success');
    navigateTo('#/');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================================================
// CREATE POST VIEW (Exact Tutorial: Title, File, Category "Add" button, Desc)
// ==========================================================================
async function initCreatePostView() {
  state.createCategories = ['Tech'];
  state.selectedCoverUrl = '/assets/hero.jpg';

  document.getElementById('create-title-input').value = '';
  document.getElementById('create-desc-input').value = '';
  document.getElementById('create-category-input').value = '';
  renderCategoryTags('create');
  loadPresetsForView('create');
}

function addCategoryTag(mode) {
  const input = document.getElementById(`${mode}-category-input`);
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const targetArr = mode === 'create' ? state.createCategories : state.editCategories;
  if (!targetArr.includes(val)) {
    targetArr.push(val);
  }
  input.value = '';
  renderCategoryTags(mode);
}

function removeCategoryTag(mode, index) {
  const targetArr = mode === 'create' ? state.createCategories : state.editCategories;
  targetArr.splice(index, 1);
  renderCategoryTags(mode);
}

function renderCategoryTags(mode) {
  const container = document.getElementById(`${mode}-categories-list`);
  if (!container) return;
  const targetArr = mode === 'create' ? state.createCategories : state.editCategories;

  container.innerHTML = targetArr.map((cat, i) => `
    <span class="tag-pill-removable">
      <span>${escapeHtml(cat)}</span>
      <button type="button" onclick="removeCategoryTag('${mode}', ${i})" title="Remove">✕</button>
    </span>
  `).join('');
}

async function loadPresetsForView(mode) {
  const container = document.getElementById(`${mode}-presets-grid`);
  if (!container) return;

  try {
    const data = await window.api.getCoverPresets();
    container.innerHTML = data.presets.map(p => `
      <div class="preset-item ${state.selectedCoverUrl === p.url ? 'selected' : ''}" onclick="selectPreset('${p.url}', '${mode}')">
        <img src="${p.url}" alt="${escapeHtml(p.title)}">
        <span class="preset-label">${escapeHtml(p.category)}</span>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function selectPreset(url, mode) {
  state.selectedCoverUrl = url;
  const items = document.querySelectorAll(`#${mode}-presets-grid .preset-item`);
  items.forEach(el => {
    if (el.onclick.toString().includes(url)) {
      el.classList.add('selected');
    } else {
      el.classList.remove('selected');
    }
  });
  showToast('Cover image selected!', 'info');
}

// ==========================================================================
// EDIT POST VIEW
// ==========================================================================
async function initEditPostView(postId) {
  try {
    const data = await window.api.getPostById(postId);
    const post = data.post;

    document.getElementById('edit-post-id').value = post.id;
    document.getElementById('edit-title-input').value = post.title;
    document.getElementById('edit-desc-input').value = post.desc || post.content;
    state.selectedCoverUrl = post.photo || post.cover_image || '/assets/hero.jpg';

    state.editCategories = post.categories && post.categories.length > 0 
      ? [...post.categories]
      : (post.tags ? post.tags.split(',').map(t => t.trim()) : [post.category]);

    renderCategoryTags('edit');
    loadPresetsForView('edit');
  } catch (err) {
    showToast('Failed to load post for editing: ' + err.message, 'error');
    navigateTo('#/');
  }
}

// ==========================================================================
// PROFILE VIEW & MY BLOGS VIEW
// ==========================================================================
async function initProfileView() {
  const user = window.api.getCurrentUser();
  if (!user) return;

  document.getElementById('profile-username-input').value = user.username || user.name;
  document.getElementById('profile-email-input').value = user.email;
  document.getElementById('profile-password-input').value = '';

  const postsContainer = document.getElementById('profile-posts-list');
  postsContainer.innerHTML = `<p style="color: var(--text-muted);">Loading your posts...</p>`;

  try {
    const res = await window.api.request(`/posts/user/${user.id}`);
    if (!res.posts || res.posts.length === 0) {
      postsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem;">You haven't published any posts yet.</p>`;
      return;
    }

    postsContainer.innerHTML = res.posts.map(p => `
      <div class="home-post-row" style="margin-bottom: 1.25rem;" onclick="navigateTo('#/posts/post/${p.id}')">
        <div class="home-post-img-col" style="height: 140px;">
          <img src="${p.photo || p.cover_image || '/assets/hero.jpg'}" alt="${escapeHtml(p.title)}" class="home-post-img">
        </div>
        <div class="home-post-details-col" style="padding: 1rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.4rem;">${escapeHtml(p.title)}</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted);">${formatPostDate(p.created_at)}</p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    postsContainer.innerHTML = `<p style="color: var(--accent-rose);">${escapeHtml(err.message)}</p>`;
  }
}

async function initMyBlogsView() {
  const user = window.api.getCurrentUser();
  if (!user) return;

  const container = document.getElementById('myblogs-posts-list');
  container.innerHTML = `<p style="color: var(--text-muted);">Loading your blogs...</p>`;

  try {
    const res = await window.api.request(`/posts/user/${user.id}`);
    renderHomePosts(res.posts);
  } catch (err) {
    container.innerHTML = `<p style="color: var(--accent-rose);">${escapeHtml(err.message)}</p>`;
  }
}

async function handleDeleteAccount() {
  const user = window.api.getCurrentUser();
  if (!user) return;

  if (!confirm('Are you sure you want to permanently delete your account? All your posts and comments will be deleted.')) {
    return;
  }

  try {
    await window.api.request(`/users/${user.id}`, { method: 'DELETE' });
    window.api.logout();
    showToast('Account deleted successfully', 'info');
    navigateTo('#/register');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================================================
// EVENT LISTENERS & SETUP
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Theme init
  const savedTheme = localStorage.getItem('bm_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('bm_theme', next);
      updateThemeIcon(next);
      showToast(`Switched to ${next} mode`, 'info');
    });
  }

  function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (theme === 'light') {
      icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    } else {
      icon.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    }
  }

  // Validate active session
  if (window.api.isAuthenticated()) {
    try {
      await window.api.getMe();
      updateAuthUI();
    } catch (e) {
      updateAuthUI();
    }
  }

  // Search input with debounce
  const searchInput = document.getElementById('nav-search-input');
  const searchClear = document.getElementById('search-clear-btn');
  let searchTimer;

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      const val = e.target.value.trim();
      if (searchClear) searchClear.style.display = val ? 'flex' : 'none';

      searchTimer = setTimeout(() => {
        state.searchQuery = val;
        if (window.location.hash !== '#/') {
          navigateTo('#/');
        } else {
          loadHomePosts();
        }
      }, 300);
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      state.searchQuery = '';
      loadHomePosts();
    });
  }

  // Sort select change
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.activeSort = e.target.value;
      loadHomePosts();
    });
  }

  // Dropdown toggles
  const demoBadge = document.getElementById('demo-account-pill');
  const demoDropdown = document.getElementById('demo-dropdown');
  if (demoBadge && demoDropdown) {
    demoBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      demoDropdown.classList.toggle('active');
      loadDemoUsersList();
    });
  }

  const userProfileBtn = document.getElementById('user-profile-menu-btn');
  const userDropdown = document.getElementById('user-dropdown-menu');
  if (userProfileBtn && userDropdown) {
    userProfileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('active');
    });
  }

  document.addEventListener('click', () => {
    if (demoDropdown) demoDropdown.classList.remove('active');
    if (userDropdown) userDropdown.classList.remove('active');
  });

  // Login Form Submission
  const loginForm = document.getElementById('page-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('page-login-email').value.trim();
      const password = document.getElementById('page-login-password').value;

      try {
        const data = await window.api.login(email, password);
        showToast(`Welcome back, ${data.user.username || data.user.name}!`, 'success');
        navigateTo('#/');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Register Form Submission
  const regForm = document.getElementById('page-register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('page-reg-username').value.trim();
      const email = document.getElementById('page-reg-email').value.trim();
      const password = document.getElementById('page-reg-password').value;

      try {
        const data = await window.api.register({ username, email, password });
        showToast(`Account created! Welcome, ${data.user.username || data.user.name}.`, 'success');
        navigateTo('#/');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Create Post Form Submission
  const createForm = document.getElementById('create-post-form');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('create-title-input').value.trim();
      const desc = document.getElementById('create-desc-input').value.trim();
      const submitBtn = document.getElementById('create-post-submit-btn');

      if (!title || !desc) {
        showToast('Title and description are required', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      try {
        // Upload image file if user selected one
        const fileInput = document.getElementById('create-image-file');
        let coverUrl = state.selectedCoverUrl;

        if (fileInput && fileInput.files[0]) {
          const uploadRes = await window.api.uploadCoverImage(fileInput.files[0]);
          coverUrl = uploadRes.url;
        }

        const res = await window.api.createPost({
          title,
          desc,
          content: desc,
          photo: coverUrl,
          cover_image: coverUrl,
          categories: state.createCategories.length > 0 ? state.createCategories : ['General']
        });

        showToast('Post created successfully!', 'success');
        navigateTo(`#/posts/post/${res.post.id || res.post._id}`);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create';
      }
    });
  }

  // Edit Post Form Submission
  const editForm = document.getElementById('edit-post-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const postId = document.getElementById('edit-post-id').value;
      const title = document.getElementById('edit-title-input').value.trim();
      const desc = document.getElementById('edit-desc-input').value.trim();
      const submitBtn = document.getElementById('edit-post-submit-btn');

      if (!title || !desc) {
        showToast('Title and description are required', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Updating...';

      try {
        const fileInput = document.getElementById('edit-image-file');
        let coverUrl = state.selectedCoverUrl;

        if (fileInput && fileInput.files[0]) {
          const uploadRes = await window.api.uploadCoverImage(fileInput.files[0]);
          coverUrl = uploadRes.url;
        }

        await window.api.updatePost(postId, {
          title,
          desc,
          content: desc,
          photo: coverUrl,
          cover_image: coverUrl,
          categories: state.editCategories.length > 0 ? state.editCategories : ['General']
        });

        showToast('Post updated successfully!', 'success');
        navigateTo(`#/posts/post/${postId}`);
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update';
      }
    });
  }

  // Profile Update Form Submission
  const profileForm = document.getElementById('profile-update-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = window.api.getCurrentUser();
      if (!user) return;

      const username = document.getElementById('profile-username-input').value.trim();
      const email = document.getElementById('profile-email-input').value.trim();
      const password = document.getElementById('profile-password-input').value;

      try {
        const payload = { username, email };
        if (password) payload.password = password;

        const res = await window.api.request(`/users/${user.id}`, {
          method: 'PUT',
          body: payload
        });

        window.api.setSession(window.api.token, res.user);
        updateAuthUI();
        showToast('Profile updated successfully!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Run initial router check
  router();
});

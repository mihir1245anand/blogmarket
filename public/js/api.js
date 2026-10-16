/**
 * API Client for Digital Pulse Blogging Platform
 * Handles authentication persistence, tokens, and RESTful API endpoints.
 */

const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('dp_token') || null;
    this.user = null;
    try {
      const storedUser = localStorage.getItem('dp_user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    } catch (e) {
      this.user = null;
    }
  }

  setSession(token, user) {
    this.token = token;
    this.user = user;
    if (token) {
      localStorage.setItem('dp_token', token);
      localStorage.setItem('dp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dp_token');
      localStorage.removeItem('dp_user');
    }
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getCurrentUser() {
    return this.user;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (options.body && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If 401 Unauthorized, clear session if token invalid
      if (response.status === 401 && this.token) {
        this.setSession(null, null);
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: null } }));
      }
      const errorMsg = data.error || data.message || `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  }

  // Auth Methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    this.setSession(data.token, data.user);
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: data.user } }));
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: userData
    });
    this.setSession(data.token, data.user);
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: data.user } }));
    return data;
  }

  async demoLogin(userId) {
    const data = await this.request(`/auth/demo-login/${userId}`, {
      method: 'POST'
    });
    this.setSession(data.token, data.user);
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: data.user } }));
    return data;
  }

  async getDemoUsers() {
    return await this.request('/auth/demo-users');
  }

  async getMe() {
    if (!this.token) return null;
    try {
      const data = await this.request('/auth/me');
      this.user = data.user;
      localStorage.setItem('dp_user', JSON.stringify(data.user));
      return data.user;
    } catch (e) {
      this.setSession(null, null);
      return null;
    }
  }

  async updateProfile(profileData) {
    const data = await this.request('/auth/profile', {
      method: 'PUT',
      body: profileData
    });
    this.user = data.user;
    localStorage.setItem('dp_user', JSON.stringify(data.user));
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: data.user } }));
    return data;
  }

  logout() {
    this.setSession(null, null);
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user: null } }));
  }

  // Posts Methods
  async getPosts(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params.search) searchParams.append('search', params.search);
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.authorId) searchParams.append('authorId', params.authorId);

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/posts?${queryString}` : '/posts';
    return await this.request(endpoint);
  }

  async getPostById(id) {
    return await this.request(`/posts/${id}`);
  }

  async createPost(postData) {
    return await this.request('/posts', {
      method: 'POST',
      body: postData
    });
  }

  async updatePost(id, postData) {
    return await this.request(`/posts/${id}`, {
      method: 'PUT',
      body: postData
    });
  }

  async deletePost(id) {
    return await this.request(`/posts/${id}`, {
      method: 'DELETE'
    });
  }

  async toggleLikePost(id) {
    return await this.request(`/posts/${id}/like`, {
      method: 'POST'
    });
  }

  async toggleBookmarkPost(id) {
    return await this.request(`/posts/${id}/bookmark`, {
      method: 'POST'
    });
  }

  async getBookmarkedPosts() {
    return await this.request('/posts/user/bookmarked');
  }

  async getCategories() {
    return await this.request('/posts/meta/categories');
  }

  // Comments Methods
  async getComments(postId) {
    return await this.request(`/comments/post/${postId}`);
  }

  async addComment(postId, content, parentId = null) {
    return await this.request(`/comments/post/${postId}`, {
      method: 'POST',
      body: { content, parent_id: parentId }
    });
  }

  async deleteComment(commentId) {
    return await this.request(`/comments/${commentId}`, {
      method: 'DELETE'
    });
  }

  async toggleLikeComment(commentId) {
    return await this.request(`/comments/${commentId}/like`, {
      method: 'POST'
    });
  }

  // Upload Methods
  async getCoverPresets() {
    return await this.request('/upload/presets');
  }

  async uploadCoverImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return await this.request('/upload', {
      method: 'POST',
      body: formData
    });
  }
}

// Global API instance
window.api = new ApiClient();

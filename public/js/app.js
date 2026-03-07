// ===== API Helper =====
const API_BASE = '/api';

const api = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    localStorage.setItem('token', token);
  },

  removeToken() {
    localStorage.removeItem('token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  removeUser() {
    localStorage.removeItem('user');
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    this.removeToken();
    this.removeUser();
    window.location.href = '/login';
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = { 'Content-Type': 'application/json' };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: { ...headers, ...options.headers },
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        this.removeUser();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

// ===== UI Helpers =====
function showAlert(containerId, message, type = 'error') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.className = `alert alert-${type} show`;
  container.textContent = message;
  setTimeout(() => {
    container.classList.remove('show');
  }, 5000);
}

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function truncateText(text, maxLength = 150) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function renderPagination(containerId, pagination, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container || !pagination) return;

  const { currentPage, totalPages, hasNextPage, hasPrevPage } = pagination;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  html += `<button ${!hasPrevPage ? 'disabled' : ''} onclick="(${onPageChange.toString()})(${currentPage - 1})">← Prev</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button class="${i === currentPage ? 'active' : ''}" onclick="(${onPageChange.toString()})(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<button disabled>...</button>`;
    }
  }

  html += `<button ${!hasNextPage ? 'disabled' : ''} onclick="(${onPageChange.toString()})(${currentPage + 1})">Next →</button>`;
  container.innerHTML = html;
}

// ===== Auth Guard =====
function requireAuth() {
  if (!api.isLoggedIn()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

function requireGuest() {
  if (api.isLoggedIn()) {
    window.location.href = '/dashboard';
    return false;
  }
  return true;
}

// ===== Navbar =====
function renderNavbar() {
  const user = api.getUser();
  if (!user) return;

  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  navbar.innerHTML = `
    <div class="container">
      <a href="/dashboard" class="logo">Blog<span>Nest</span></a>
      <div class="nav-links">
        <a href="/dashboard">Dashboard</a>
        <a href="/profile/${user.username}">Profile</a>
        <div class="notification-badge" onclick="navigateToNotifications()">
          🔔 <span class="badge" id="notif-badge" style="display:none">0</span>
        </div>
        <div class="nav-user">
          <span style="font-size:0.85rem;color:var(--gray)">Hi, <strong>${user.username}</strong></span>
          <button class="btn-logout" onclick="api.logout()">Logout</button>
        </div>
      </div>
    </div>
  `;

  loadUnreadCount();
}

// Ensure clicking the navbar notification button triggers the dashboard notifications tab
function navigateToNotifications() {
  const targetHash = '#notifications';
  // If already on dashboard, just open the notifications tab without full navigation
  if (window.location.pathname === '/dashboard') {
    if (typeof switchTab === 'function') {
      switchTab('notifications');
      // update the hash so back/forward behave as expected
      history.pushState(null, '', window.location.pathname + targetHash);
      return;
    }
    // If switchTab not available yet, set the hash which will be handled on load or by hashchange
    window.location.hash = targetHash;
    return;
  }

  // Not on dashboard: navigate to dashboard and include hash so the tab opens on load
  window.location.href = `/dashboard${targetHash}`;
}

// Listen for hash changes (e.g., user clicks the navbar button while on dashboard or uses back/forward)
window.addEventListener('hashchange', () => {
  try {
    if (window.location.pathname === '/dashboard' && window.location.hash === '#notifications' && typeof switchTab === 'function') {
      switchTab('notifications');
    }
  } catch (e) {
    // ignore
  }
});

// Also handle popstate so browser back/forward triggers rendering when history changes
window.addEventListener('popstate', () => {
  try {
    if (window.location.pathname === '/dashboard') {
      if (window.location.hash === '#notifications' && typeof switchTab === 'function') {
        switchTab('notifications');
      } else if (!window.location.hash && typeof switchTab === 'function') {
        // default to feed when no hash
        switchTab('feed');
      }
    }
  } catch (e) {
    // ignore
  }
});

async function loadUnreadCount() {
  try {
    const res = await api.get('/notifications/unread-count');
    const badge = document.getElementById('notif-badge');
    if (badge && res.data.unreadCount > 0) {
      badge.textContent = res.data.unreadCount;
      badge.style.display = 'flex';
    }
  } catch (e) {
    // silently fail
  }
}

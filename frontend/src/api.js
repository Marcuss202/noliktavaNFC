// API base URL - adjust for production
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Fetch with credentials (cookies)
const fetchWithAuth = (url, options = {}) => {
  return fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

export const authAPI = {
  // Get current user from JWT cookie
  me: async () => {
    const res = await fetchWithAuth('/api/auth/me');
    if (res.ok) return res.json();
    return null;
  },

  // Login and set cookie
  login: async (email, password) => {
    const res = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) return res.json();
    const error = await res.json();
    throw new Error(error.detail || 'Login failed');
  },

  // Register new user
  register: async (email, password, full_name, phone) => {
    const res = await fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, phone }),
    });
    if (res.ok) return res.json();
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  },

  // Logout and clear cookie
  logout: async () => {
    await fetchWithAuth('/api/auth/logout', { method: 'POST' });
  },
};

// API base URL - adjust for production
// By default we use a relative path so that the Vite dev server proxy
// forwards /api to the Django backend.  If you specify VITE_API_URL it
// overrides this behaviour (e.g. production build).
const ENV_API = import.meta.env.VITE_API_URL;
const DEV_FALLBACK_API = import.meta.env.DEV ? 'http://localhost:8000' : '';
export const API_BASE = ENV_API ? ENV_API.replace(/\/$/, '') : DEV_FALLBACK_API;

// Fetch with credentials (cookies)
export const fetchWithAuth = (url, options = {}) => {
  const fullUrl = `${API_BASE}${url}`;
  const body = options.body;

  const headers = { ...(options.headers || {}) };
  // don't hard‑set Content-Type when sending FormData; let the browser
  // pick the right multipart boundary
  if (!(body instanceof FormData) && headers['Content-Type'] === undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // add Authorization header if token stored
  const token = localStorage.getItem('jwt_access');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(fullUrl, {
    ...options,
    credentials: 'include',
    headers,
  });
};

// Public fetch without sending cookies (fallback for guests)
export const fetchPublic = (url, options = {}) => {
  return fetch(`${API_BASE}${url}`, {
    ...options,
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
    if (res.ok) {
      const data = await res.json();
      // store access token for header auth fallback
      if (data.access) {
        localStorage.setItem('jwt_access', data.access);
      }
      return data;
    }
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
    localStorage.removeItem('jwt_access');
  },
};

const buildReportQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  searchParams.set('range', params.range || '30d');

  if (params.from) {
    searchParams.set('from', params.from);
  }
  if (params.to) {
    searchParams.set('to', params.to);
  }

  return `?${searchParams.toString()}`;
};

const fetchReport = async (path, params = {}) => {
  const res = await fetchWithAuth(`${path}${buildReportQuery(params)}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch report');
  }
  return res.json();
};

export const reportsAPI = {
  dashboard: (params = {}) => fetchReport('/api/reports/dashboard', params),
  sales: (params = {}) => fetchReport('/api/reports/sales', params),
  purchases: (params = {}) => fetchReport('/api/reports/purchases', params),
};

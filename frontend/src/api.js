// API base URL - adjust for production
// By default we use a relative path so that the Vite dev server proxy
// forwards /api to the Django backend.  If you specify VITE_API_URL it
// overrides this behaviour (e.g. production build).
const ENV_API = import.meta.env.VITE_API_URL;
const DEV_FALLBACK_API = import.meta.env.DEV ? '' : '';

const sanitizeApiBase = (apiBase) => {
  if (!apiBase) return apiBase;

  try {
    const url = new URL(apiBase);
    const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const pageHost = window.location.hostname;
    const pageIsLocal = pageHost === 'localhost' || pageHost === '127.0.0.1';

    // Browsers block remote pages (e.g. Cloudflare tunnel) from calling loopback.
    if (isLoopback && !pageIsLocal) {
      return '';
    }
  } catch {
    // If parse fails, keep value as-is.
  }

  return apiBase;
};

export const API_BASE = sanitizeApiBase(ENV_API ? ENV_API.replace(/\/$/, '') : DEV_FALLBACK_API);

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
  }).then((res) => {
    const authRoute = url.startsWith('/api/auth/login') || url.startsWith('/api/auth/register');
    if (res.status === 401 && !authRoute) {
      localStorage.removeItem('jwt_access');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return res;
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
  orders: (params = {}) => fetchReport('/api/reports/orders', params),
};

export const ordersAPI = {
  // List all orders (staff), optionally sorted (e.g. sort='address' or '-created_at')
  list: async (sort = '-created_at') => {
    const query = sort ? `?sort=${encodeURIComponent(sort)}` : '';
    const res = await fetchWithAuth(`/api/orders${query}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || error.error || 'Failed to load orders');
    }
    return res.json();
  },

  // Update an order's status (staff)
  updateStatus: async (id, status) => {
    const res = await fetchWithAuth(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || error.error || 'Failed to update order');
    }
    return res.json();
  },
};

export const accountsAPI = {
  // List existing account emails for the checkout email dropdown
  emails: async () => {
    const res = await fetchWithAuth('/api/accounts/emails');
    if (!res.ok) return [];
    const data = await res.json();
    return data.emails || [];
  },
};

// Place an order from cart items + shipping details
export const checkoutAPI = {
  placeOrder: async (payload) => {
    const res = await fetchWithAuth('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.detail || 'Checkout failed');
    }
    return data;
  },
};

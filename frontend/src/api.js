const ENV_API = import.meta.env.VITE_API_URL;
const DEV_FALLBACK_API = import.meta.env.DEV ? "" : "";

const sanitizeApiBase = (apiBase) => {
  if (!apiBase) return apiBase;

  try {
    const url = new URL(apiBase);
    const isLoopback =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const pageHost = window.location.hostname;
    const pageIsLocal = pageHost === "localhost" || pageHost === "127.0.0.1";

    if (isLoopback && !pageIsLocal) {
      return "";
    }
  } catch {}

  return apiBase;
};

export const API_BASE = sanitizeApiBase(
  ENV_API ? ENV_API.replace(/\/$/, "") : DEV_FALLBACK_API,
);

export const fetchWithAuth = (url, options = {}) => {
  const fullUrl = `${API_BASE}${url}`;
  const body = options.body;

  const headers = { ...(options.headers || {}) };

  if (!(body instanceof FormData) && headers["Content-Type"] === undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("jwt_access");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(fullUrl, {
    ...options,
    credentials: "include",
    headers,
  }).then((res) => {
    const authRoute =
      url.startsWith("/api/auth/login") || url.startsWith("/api/auth/register");
    if (res.status === 401 && !authRoute) {
      localStorage.removeItem("jwt_access");
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return res;
  });
};

export const fetchPublic = (url, options = {}) => {
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
};

export const authAPI = {
  me: async () => {
    const res = await fetchWithAuth("/api/auth/me");
    if (res.ok) return res.json();
    return null;
  },

  login: async (email, password) => {
    const res = await fetchWithAuth("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const data = await res.json();

      if (data.access) {
        localStorage.setItem("jwt_access", data.access);
      }
      return data;
    }
    const error = await res.json();
    throw new Error(error.detail || "Login failed");
  },

  logout: async () => {
    const res = await fetchWithAuth("/api/auth/logout", {
      method: "POST",
    });

    localStorage.removeItem("jwt_access");
    localStorage.removeItem("auth_is_staff");

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || "Logout failed");
    }

    return true;
  },

  register: async (email, password, fullName, phone) => {
    const res = await fetchWithAuth("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        phone,
      }),
    });

    const text = await res.text();

    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.error("Server returned HTML:", text);
      throw new Error("API route is not reaching Django backend.");
    }

    if (!res.ok) {
      throw new Error(
        data.password?.[0] ||
          data.email?.[0] ||
          data.full_name?.[0] ||
          data.phone?.[0] ||
          data.detail ||
          "Registration failed",
      );
    }

    return data;
  },
};

const buildReportQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  searchParams.set("range", params.range || "30d");

  if (params.from) {
    searchParams.set("from", params.from);
  }
  if (params.to) {
    searchParams.set("to", params.to);
  }

  return `?${searchParams.toString()}`;
};

const fetchReport = async (path, params = {}) => {
  const res = await fetchWithAuth(`${path}${buildReportQuery(params)}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to fetch report");
  }
  return res.json();
};

export const reportsAPI = {
  dashboard: (params = {}) => fetchReport("/api/reports/dashboard", params),
  sales: (params = {}) => fetchReport("/api/reports/sales", params),
  orders: (params = {}) => fetchReport("/api/reports/orders", params),
};

export const ordersAPI = {
  list: async (sort = "-created_at") => {
    const query = sort ? `?sort=${encodeURIComponent(sort)}` : "";
    const res = await fetchWithAuth(`/api/orders${query}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || error.error || "Failed to load orders");
    }
    return res.json();
  },

  updateStatus: async (id, status) => {
    const res = await fetchWithAuth(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || error.error || "Failed to update order");
    }
    return res.json();
  },
};

export const accountsAPI = {
  emails: async () => {
    const res = await fetchWithAuth("/api/accounts/emails");
    if (!res.ok) return [];
    const data = await res.json();
    return data.emails || [];
  },
};

export const checkoutAPI = {
  placeOrder: async (payload) => {
    const res = await fetchWithAuth("/api/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.detail || "Checkout failed");
    }
    return data;
  },
};

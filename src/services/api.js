import axios from 'axios';

/**
 * Pre-configured Axios instance for LegacyVault backend communication.
 * Dynamically resolves API base URL from VITE_API_BASE_URL (for production deployments, e.g., on Vercel)
 * and falls back to local development 'http://localhost:8080/api'.
 */
function resolveBaseUrl() {
  let url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  // Strip trailing slashes
  while (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  // Ensure /api suffix is present
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request interceptor: attach valid JWT Bearer token to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiry or unauthenticated responses cleanly
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

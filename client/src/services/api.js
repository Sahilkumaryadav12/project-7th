import axios from 'axios';

export const resolveBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (!envUrl) return '/api';
  const cleanUrl = envUrl.replace(/\/+$/, '');
  if ((cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) && !cleanUrl.endsWith('/api')) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token for seamless cross-origin auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('meditrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired sessions
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('meditrack_token');
      localStorage.removeItem('meditrack_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  const apiUrl = resolveBaseUrl();
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    const origin = apiUrl.replace(/\/api\/?$/, '');
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  }
  return path;
};

export default api;

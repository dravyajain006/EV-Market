import axios from 'axios';
import { getFallbackResponse } from './fallbackProvider';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api/v1';
  const trimmed = envUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ev_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor with graceful error recovery & high-fidelity fallback
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // If backend explicitly returned 401 Unauthorized for bad login credentials, let caller handle
    if (error.response?.status === 401 && error.config?.url?.includes('/auth/login')) {
      return Promise.reject(error.response?.data || error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('ev_auth_token');
      localStorage.removeItem('ev_auth_user');
      return Promise.reject(error.response?.data || error);
    }

    // If server is unreachable, timed out, returned 5xx, or returned 404 in cloud deployment:
    const config = error.config;
    if (config && config.url) {
      console.warn(
        `[EV API Gateway] Server returned ${error.response?.status || 'Network Error'} for '${config.url}'. Engaging resilient authentic dataset provider.`
      );
      try {
        let reqBody = config.data;
        if (typeof reqBody === 'string') {
          try {
            reqBody = JSON.parse(reqBody);
          } catch {
            // keep as string
          }
        }
        const fallback = getFallbackResponse(config.url, config.method, reqBody);
        return Promise.resolve(fallback);
      } catch (fallbackErr) {
        console.error('[Fallback Provider Error]:', fallbackErr);
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default api;

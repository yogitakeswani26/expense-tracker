import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(config => {
  // Get token from Zustand store first, fallback to localStorage
  const store = useAuthStore.getState();
  const token = store.accessToken || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const store = useAuthStore.getState();
        const refreshToken = store.refreshToken || localStorage.getItem('refreshToken');
        const response = await api.post('/auth/refresh', { refreshToken });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        // CRITICAL: Update BOTH localStorage and Zustand store to keep them in sync
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Update Zustand store
        store.setTokens(accessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear both storage and store on refresh failure
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        const store = useAuthStore.getState();
        store.logout();

        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// src/lib/axios.ts
const API_BASE_URL =
  typeof window !== "undefined"
    ? `http://${window.location.hostname}:5000/api`
    : "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});


api.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.config.method?.toUpperCase()}] ${response.config.url}:`, response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Har error ka exact message aur status browser console mein dikhayein
    console.log(
      `❌ [${originalRequest?.method?.toUpperCase()}] ${originalRequest?.url} (${error.response?.status}):`,
      error.response?.data || error.message
    );

    if (originalRequest?.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post('http://localhost:5000/api/auth/refresh', {}, { withCredentials: true });
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.setState({ user: null, isAuthenticated: false });
        if (typeof window !== 'undefined' && !['/login', '/register'].includes(window.location.pathname)) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);



  

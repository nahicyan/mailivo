// app/src/lib/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// app/src/lib/api.ts
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  transformRequest: [
    (data) => {
      console.log('Axios sending:', data); // Debug log
      return JSON.stringify(data);
    }
  ]
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not already on auth pages
      const isAuthPage = window.location.pathname.includes('/login') || 
                        window.location.pathname.includes('/register');
      
      localStorage.removeItem('auth_token');
      
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
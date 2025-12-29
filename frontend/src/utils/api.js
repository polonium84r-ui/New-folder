import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  // Use environment variable for API URL in production, fallback to relative path for development
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL 
    : '/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to false for Render deployment
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } else if (error.response?.status === 403 && error.response?.data?.passwordReset) {
      // Password was reset, force logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Store message to show after redirect
      localStorage.setItem('passwordResetMessage', 'Your password was reset by an administrator. Please log in with your new password.');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
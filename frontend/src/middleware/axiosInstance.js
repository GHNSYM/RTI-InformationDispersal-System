import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable credentials for CORS
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Request headers:', config.headers);
      console.log('User from localStorage:', user);
    } else {
      console.warn('No token found in localStorage');
    }

    // Add department_code to request if user is from department (role "2")
    if (user.role === "2" && user.department_code) {
      // For GET requests, add as query parameter
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          department_code: user.department_code
        };
      }
      // For POST/PUT requests, add to request body
      else if (['post', 'put'].includes(config.method)) {
        if (config.data instanceof FormData) {
          config.data.append('department_code', user.department_code);
        } else {
          config.data = {
            ...config.data,
            department_code: user.department_code
          };
        }
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('Response error:', error);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // Handle CORS errors
    if (error.message === 'Network Error') {
      console.error('Network Error - Please check your connection');
      return Promise.reject(error);
    }

    // Handle host validation errors
    if (error.response?.data?.error?.includes('host validation failed')) {
      console.error('Host validation failed - Please check your connection settings');
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
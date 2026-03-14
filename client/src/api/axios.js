// src/api/axios.js
import axios from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - attach JWT token to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('campusLinkToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle 401 errors globally
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const requestUrl = (error.config && error.config.url) || '';
        const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

        if (error.response && error.response.status === 401 && !isAuthEndpoint) {
            localStorage.removeItem('campusLinkToken');
            localStorage.removeItem('campusLinkUser');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
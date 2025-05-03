
import axios from 'axios';
import { toast } from 'sonner';

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

console.log('API base URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials if using cookies
  withCredentials: false,
  // Disable redirects to see actual responses
  maxRedirects: 0,
  // Add timeout with a longer duration for development
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log outgoing requests in development
    console.log(`Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config);
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    console.log('Response success:', response.status, response.data, response);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    }
    
    const message = error.response?.data?.message || error.message || 'An unknown error occurred';
    
    // Don't show toast if this is an auth error - handle separately in login form
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

import axios from 'axios';

// API base URL - automatically detects development vs production
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add timeout to prevent long loading
});

// Add request interceptor to include necessary auth headers or API keys
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    const separator = config.url?.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}_t=${Date.now()}`;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle API errors gracefully
    console.error('API Error:', error);
    
    // Add custom error handling logic here
    if (error.response) {
      // Server responded with error status
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', error.request);
      console.error('Is the backend server running at http://localhost:8000?');
      // You might want to show a user-friendly message here
    }
    
    return Promise.reject(error);
  }
);

// Check if backend is available on startup
const checkBackendConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('Backend connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('Backend connection failed. Please ensure the server is running at http://localhost:8000');
    return false;
  }
};

// Call this function on app startup
checkBackendConnection();

export default api;

// Enhanced API functions that include location data
export const withLocation = (params: object) => {
  // Get location from localStorage if available
  const locationData = localStorage.getItem('userLocation');
  
  if (locationData) {
    try {
      const { lat, lon } = JSON.parse(locationData);
      return {
        ...params,
        lat,
        lon
      };
    } catch (e) {
      console.error('Failed to parse location data', e);
      return params;
    }
  }
  
  return params;
};
// src/api/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// Base URL - matches the API you provided (port 8000)
import { BASE_URL } from '../constants/Config';

// Base URL - matches the API you provided (port 8000)
// const BASE_URL = 'http://213.199.51.193:8000'; // Moved to Config.js

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor:
 * - reads token from AsyncStorage (if present) and attaches Authorization header
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // Ignore token read errors; request will proceed without Authorization header
      console.warn('apiClient: error reading token', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor:
 * - handles network errors and shows toast notifications
 * - handles 401 unauthorized errors
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Network error (no response from server)
    if (!error.response) {
      Toast.show({
        type: 'custom_error',
        text1: 'No Internet Connection',
        text2: 'Please check your network and try again',
        position: 'top',
        topOffset: 0,
        visibilityTime: 4000,
        props: { iconName: 'wifi-off' }
      });
      console.error('Network error:', error.message);
      return Promise.reject(error);
    }

    // 401 Unauthorized - token expired or invalid
    if (error.response.status === 401) {
      Toast.show({
        type: 'custom_error',
        text1: 'Session Expired',
        text2: 'Please log in again',
        position: 'top',
        topOffset: 0,
        visibilityTime: 3000,
        props: { iconName: 'account-alert' }
      });
      // Clear token and redirect to login would happen here
      await AsyncStorage.removeItem('@auth_token');
    }

    // Other errors (400, 500, etc.)
    else if (error.response.status >= 500) {
      Toast.show({
        type: 'custom_error',
        text1: 'Server Error',
        text2: 'Something went wrong. Please try again later.',
        position: 'top',
        topOffset: 0,
        visibilityTime: 3000,
        props: { iconName: 'alert-circle' }
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Check server health
 * GET /api/users/_health
 */
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/api/users/_health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default api;
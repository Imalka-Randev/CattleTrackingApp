// src/api/apiClient.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default api;
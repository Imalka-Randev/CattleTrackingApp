// src/api/authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://213.199.51.193:3000'; // change here if needed

const TOKEN_KEY = '@auth_token';

/**
 * Call login API
 * body: { mobile, password }
 * returns parsed JSON (caller will handle response.ok)
 */
export async function loginApi(mobile, password) {
  const url = `${BASE_URL}/api/users/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, password }),
  });

  const data = await response.json();
  // caller decides if response.ok
  return { ok: response.ok, status: response.status, data };
}

/**
 * apiClient: use for future authenticated requests.
 * It reads token from AsyncStorage and adds Authorization header if present.
 *
 * Usage:
 *  const res = await apiClient('/api/cattle/user/U001', { method: 'GET' });
 *  const json = await res.json()
 */
export async function apiClient(path, options = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
}
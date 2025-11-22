// src/api/authService.js
import api from './apiClient';

/**
 * loginApi(mobile, password)
 * Calls POST /api/users/login
 * Returns { ok: boolean, status: number, data: any }
 */
export async function loginApi(mobile, password) {
  try {
    const response = await api.post('/api/users/login', { mobile, password });
    // Successful response (200)
    return {
      ok: true,
      status: response.status,
      data: response.data,
    };
  } catch (err) {
    // err.response may be undefined (network error)
    const status = err.response?.status || 0;
    const data = err.response?.data || { message: err.message || 'Network error' };
    return { ok: false, status, data };
  }
}
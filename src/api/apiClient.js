import axios from 'axios';
import { ensureAccessToken, recoverAuthentication } from '../auth/cognito.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  if (!config.baseURL?.trim()) {
    throw new Error('API_BASE_URL_MISSING');
  }
  const token = await ensureAccessToken();
  if (!token) {
    await recoverAuthentication();
    throw new Error('AUTH_REQUIRED');
  }
  config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

api.interceptors.response.use((response) => response, async (error) => {
  if (error.response?.status === 401) {
    const config = error.config;
    if (config && !config._authRetried) {
      config._authRetried = true;
      try {
        const rejectedToken = config.headers.get('Authorization')?.replace(/^Bearer /, '');
        const token = await ensureAccessToken(rejectedToken);
        if (token) return api.request(config);
        await recoverAuthentication();
      } catch { /* Transient refresh failures retain credentials for the next request. */ }
    }
  }
  // Do not propagate Axios config/headers or raw backend payloads to callers.
  const safeError = new Error(axios.isCancel(error) ? 'REQUEST_CANCELED' : error.message === 'API_BASE_URL_MISSING' ? 'API_BASE_URL_MISSING' : 'API_REQUEST_FAILED');
  if (error.response) safeError.response = { status: error.response.status };
  return Promise.reject(safeError);
});
export default api;

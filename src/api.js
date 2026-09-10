/**
 * api.js - HTTP client with auto-refresh token support
 * Dùng cho toàn bộ frontend CodeRoom
 */

import { getAccessToken, refreshAccessToken, authHeaders, logout } from './services/auth';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── URL builder ────────────────────────────────────────────────────────
const buildUrl = (path, params) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_URL}${normalizedPath}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
};

export const parseResponseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) return contentType.includes('application/json') ? {} : '';

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Server trả về JSON không hợp lệ (HTTP ${response.status}).`);
    }
  }

  return text;
};

// ── Core request ───────────────────────────────────────────────────────
const request = async (method, path, options = {}) => {
  const headers = {
    ...authHeaders(),
    ...(options.body || options.json ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  let body;
  if (options.body) {
    body = JSON.stringify(options.body);
  } else if (options.json) {
    body = options.json;
  }

  const credentialsOption = options.credentials || 'include';

  let response = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    body,
    signal: options.signal,
    credentials: credentialsOption,
  });

  // ── Auto refresh on 401 ────────────────────────────────────
  if (response.status === 401 && getAccessToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Thử lại request với token mới
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(buildUrl(path, options.params), {
        method,
        headers,
        body,
        signal: options.signal,
        credentials: credentialsOption,
      });
    } else {
      // Refresh thất bại → redirect login
      logout();
      throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const message = typeof data === 'object' ? data.message || data.error : data;
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return { data, response };
};

// ── Public helpers (no auth) ───────────────────────────────────────────
export const publicRequest = async (path, options = {}) => {
  const response = await fetch(buildUrl(path, options.params), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await parseResponseBody(response);
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
};

// ── Shortcut: fetch raw response (for SSE streaming) ───────────────────
export const fetchRaw = async (path, options = {}) => {
  const headers = {
    ...authHeaders(),
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  return fetch(buildUrl(path, options.params), {
    method: options.method || 'POST',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
};

// ── Legacy helper: lấy token cũ (tương thích code cũ) ──────────────────
// Để migrate dần, component nào cần token có thể dùng:
//   import { getAccessToken } from './services/auth';
// thay vì localStorage.getItem('token')

// ── API object ─────────────────────────────────────────────────────────
const API = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options = {}) => request('POST', path, { ...options, body }),
  patch: (path, body, options = {}) => request('PATCH', path, { ...options, body }),
  put: (path, body, options = {}) => request('PUT', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
};

export default API;

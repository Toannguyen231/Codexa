const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Auth helpers ───────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token') || '';
const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

  const response = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    body,
    signal: options.signal,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  // ── Auto logout on 401 (token expired/invalid) ─────────────────
  if (response.status === 401 && getToken()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

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
  const data = await response.json();
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

// ── API object ─────────────────────────────────────────────────────────
const API = {
  get: (path, options) => request('GET', path, options),
  post: (path, body, options = {}) => request('POST', path, { ...options, body }),
  patch: (path, body, options = {}) => request('PATCH', path, { ...options, body }),
  put: (path, body, options = {}) => request('PUT', path, { ...options, body }),
  delete: (path, options) => request('DELETE', path, options),
};

export default API;

/**
 * auth.js - Quản lý token, refresh token, user session
 * Dùng chung cho toàn bộ frontend CodeRoom
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  USER: 'user',
};

const API_URL = import.meta.env.VITE_API_URL || '/api';

const parseJsonResponse = async (res) => {
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
};

// ── Token helpers ────────────────────────────────────────────

export const getAccessToken = () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem('token') || '';

export const setAccessToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

export const clearAccessToken = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const authHeaders = () => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── User helpers ─────────────────────────────────────────────

export const getUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUser = (user) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const clearUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

// ── Session ─────────────────────────────────────────────────

export const isAuthenticated = () => !!getAccessToken();

export const logout = () => {
  clearAccessToken();
  clearUser();
  // Gửi request logout backend (fire-and-forget)
  try {
    fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  } catch {
    // Ignore logout network errors.
  }
  window.location.href = '/login';
};

// ── Refresh token ────────────────────────────────────────────

let refreshPromise = null;

/**
 * Gọi /auth/refresh để lấy access token mới từ httpOnly cookie.
 * Trả về access token string, hoặc null nếu refresh thất bại.
 * Singleton: tránh nhiều request refresh đồng thời.
 */
export const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        // Refresh thất bại → logout
        clearAccessToken();
        clearUser();
        return null;
      }

      const data = await parseJsonResponse(res);
      const newToken = data.accessToken || data.token;
      if (newToken) {
        setAccessToken(newToken);
      }
      return newToken;
    } catch {
      clearAccessToken();
      clearUser();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Kiểm tra + refresh token nếu sắp hết hạn (JWT decode client side).
 * Token JWT hết hạn khi payload.exp < Date.now()/1000
 */
export const ensureValidToken = async () => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Nếu còn > 60 giây → OK
    if (payload.exp > Math.floor(Date.now() / 1000) + 60) {
      return token;
    }
  } catch {
    // Token không decode được → refresh luôn
  }

  return refreshAccessToken();
};

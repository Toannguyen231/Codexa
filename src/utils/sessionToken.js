import API from '../api';

const SESSION_TOKEN_KEY = 'coderoom.sessionToken';

const hasSessionStorage = () => typeof window !== 'undefined' && window.sessionStorage;

export const getStoredSessionToken = () => {
  if (!hasSessionStorage()) return '';
  return window.sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
};

export const clearSessionToken = () => {
  if (!hasSessionStorage()) return;
  window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
};

export const getOrCreateSessionToken = async () => {
  const existing = getStoredSessionToken();
  if (existing) return existing;

  const { data } = await API.post('auth/session');
  if (!data.sessionToken) {
    throw new Error(data.message || 'Không thể tạo session token.');
  }

  if (hasSessionStorage()) {
    window.sessionStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
  }

  return data.sessionToken;
};

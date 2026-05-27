const API_URL = import.meta.env.VITE_API_URL || '/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const request = async (url, options = {}) => {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Không kết nối được server. Hãy chạy backend (port 3001) và thử lại.');
  }
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Lỗi server (${res.status})`);
  }
  if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra.');
  return data;
};

export const getMe = async () => {
  const data = await request(`${API_URL}/auth/me`, { headers: authHeaders() });
  return data.user;
};

export const updateProfile = async (payload) => {
  const data = await request(`${API_URL}/auth/profile`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return data.user;
};

export const updateAvatar = async (avatar) => {
  const data = await request(`${API_URL}/auth/avatar`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ avatar }),
  });
  return data.user;
};

export const deleteAvatar = async () => {
  const data = await request(`${API_URL}/auth/avatar`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return data.user;
};

export const changePassword = async (currentPassword, newPassword) => {
  return request(`${API_URL}/auth/password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

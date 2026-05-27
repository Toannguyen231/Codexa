const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const handleRes = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra.');
  return data;
};

export const getMe = async () => {
  const data = await handleRes(await fetch(`${API_URL}/auth/me`, { headers: authHeaders() }));
  return data.user;
};

export const updateProfile = async (payload) => {
  const data = await handleRes(await fetch(`${API_URL}/auth/profile`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  }));
  return data.user;
};

export const updateAvatar = async (avatar) => {
  const data = await handleRes(await fetch(`${API_URL}/auth/avatar`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ avatar }),
  }));
  return data.user;
};

export const deleteAvatar = async () => {
  const data = await handleRes(await fetch(`${API_URL}/auth/avatar`, {
    method: 'DELETE',
    headers: authHeaders(),
  }));
  return data.user;
};

export const changePassword = async (currentPassword, newPassword) => {
  return handleRes(await fetch(`${API_URL}/auth/password`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  }));
};

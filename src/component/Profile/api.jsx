import API from '../../api';

export const getMe = async () => {
  const { data } = await API.get('auth/me');
  return data.user;
};

export const updateProfile = async (payload) => {
  const { data } = await API.patch('auth/profile', payload);
  return data.user;
};

export const updateAvatar = async (avatar) => {
  const { data } = await API.put('auth/avatar', { avatar });
  return data.user;
};

export const deleteAvatar = async () => {
  const { data } = await API.delete('auth/avatar');
  return data.user;
};

export const changePassword = async (currentPassword, newPassword) => {
  const { data } = await API.patch('auth/password', { currentPassword, newPassword });
  return data;
};

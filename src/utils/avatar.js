export const getInitials = (username = '') =>
  username.slice(0, 2).toUpperCase() || 'U';

export const getAvatarColor = (username = '') => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const resolveAvatar = (user) => {
  if (user?.avatar) return { type: 'image', src: user.avatar };
  return {
    type: 'initials',
    initials: getInitials(user?.username),
    color: getAvatarColor(user?.username || ''),
  };
};

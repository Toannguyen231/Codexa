import React from 'react';
import { resolveAvatar } from '../../utils/avatar';

/** Avatar nhỏ tái sử dụng — className gắn vào wrapper */
const Avatar = ({ user, className = '', size = 'md' }) => {
  const avatar = resolveAvatar(user);
  const sizeClass = `avatar-${size}`;

  if (avatar.type === 'image') {
    return (
      <img
        src={avatar.src}
        alt=""
        className={`avatar-img ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`avatar-initials ${sizeClass} ${className}`}
      style={{ background: avatar.color }}
    >
      {avatar.initials}
    </div>
  );
};

export default Avatar;

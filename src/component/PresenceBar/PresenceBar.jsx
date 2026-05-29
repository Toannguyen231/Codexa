import React from 'react';
import { FiUsers } from 'react-icons/fi';
import './PresenceBar.scss';

const PresenceBar = ({ onlineUsers = [], activeRoom, onOpenRoom }) => {
  const onlineCount = onlineUsers.length || activeRoom?.onlineCount || 0;

  return (
    <div className="presence-bar">
      <div className="presence-info">
        <FiUsers size={14} />
        <span>{onlineCount} online trong phòng bài này</span>
      </div>
      {activeRoom ? (
        <button type="button" onClick={onOpenRoom} className="presence-room-btn">
          Vào phòng đang hoạt động
        </button>
      ) : (
        <button type="button" onClick={onOpenRoom} className="presence-room-btn">
          Tạo phòng giải chung
        </button>
      )}
    </div>
  );
};

export default PresenceBar;

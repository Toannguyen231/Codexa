import React, { useState, useEffect } from 'react';
import './Sidebar.scss';
import { FiChevronLeft, FiChevronRight, FiUsers } from 'react-icons/fi';

// Màu avatar cho user online (xoay vòng)
const AVATAR_COLORS = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4'];

// Lấy 2 ký tự đầu làm initials
const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??';

const Sidebar = ({ onlineUsers = [] }) => {
  const [collapsed, setCollapsed] = useState(false);


  useEffect(() => {
    console.log('Sidebar mounted with onlineUsers:', onlineUsers);
  }, [onlineUsers]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <span className="sidebar-title">
          <FiUsers size={11} style={{ marginRight: 5 }} />
          {!collapsed ? 'Participants' : ''}
        </span>
        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Mở sidebar' : 'Đóng sidebar'}
        >
          {collapsed ? <FiChevronRight size={15} /> : <FiChevronLeft size={15} />}
        </button>
      </div>

      {/* User List */}
      <div className="user-list">
        {onlineUsers.length > 0 ? onlineUsers.map((user, idx) => (
          <div key={user.socketId} className="user-item" title={collapsed ? user.username : ''}>
            <div className="user-avatar-sm" style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
              {getInitials(user.username)}
              <span className="status-dot online" />
            </div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-status-text online-text">
                ● Online
              </div>
            </div>
          </div>
        )) : (
          <div style={{ padding: '12px 14px', color: 'var(--text-dim)', fontSize: '12px' }}>
            Chưa có ai trong phòng
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="online-summary">
          <span className="online-dot" />
          <span>{onlineUsers.length} online</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

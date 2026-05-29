import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.scss';
import { FiChevronLeft, FiChevronRight, FiUsers, FiMessageSquare, FiSend } from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa6';

const AVATAR_COLORS = ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4'];
const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??';

const getJoinTimeAgo = (joinedAt, now) => {
  if (!joinedAt) return '';
  const diff = now ? Math.floor((now - joinedAt) / 1000) : 0;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const formatMsgTime = (ts) => {
  const d = new Date(ts);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const Sidebar = ({ onlineUsers = [], currentUser = {}, roomId, socket, isConnected, roomOwner = '', roomParticipants = [] }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('people'); // 'people' | 'chat'
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [now, setNow] = useState(0);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  // Cập nhật time mỗi 30s
  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
    };
  }, []);

  // Lắng nghe tin nhắn từ socket
  useEffect(() => {
    if (!socket) return;

    const handleMsg = (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Nếu đang không ở tab chat → tăng unread
      setActiveTab((tab) => {
        if (tab !== 'chat') setUnreadCount((c) => c + 1);
        return tab;
      });
    };

    socket.on('receive-message', handleMsg);
    return () => socket.off('receive-message', handleMsg);
  }, [socket]);

  // Scroll xuống cuối khi có tin mới
  useEffect(() => {
    if (activeTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Khi mở tab chat → clear unread
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'chat') setUnreadCount(0);
  };

  const sendMessage = () => {
    const text = inputMsg.trim();
    if (!text || !socket || !isConnected) return;

    socket.emit('send-message', {
      roomId,
      text,
      username: currentUser.username || 'Anonymous',
    });
    setInputMsg('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentUsername = currentUser.username || '';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* ── Header ── */}
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab-btn ${activeTab === 'people' ? 'active' : ''}`}
              onClick={() => handleTabChange('people')}
              title="Participants"
            >
              <FiUsers size={13} />
              <span>People</span>
            </button>
            <button
              className={`sidebar-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => handleTabChange('chat')}
              title="Chat"
            >
              <FiMessageSquare size={13} />
              <span>Chat</span>
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          </div>
        )}
        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Mở sidebar' : 'Đóng sidebar'}
        >
          {collapsed ? <FiChevronRight size={15} /> : <FiChevronLeft size={15} />}
        </button>
      </div>

      {/* ── Tab: People ── */}
      {(activeTab === 'people' || collapsed) && (
        <div className="user-list">
          {/* ── Online Users ── */}
          {onlineUsers.length > 0 ? onlineUsers.map((user, idx) => {
            const isYou = socket && user.socketId === socket.id;
            const isOwner = user.username === roomOwner;
            return (
              <div
                key={user.socketId}
                className={`user-item ${isYou ? 'is-you' : ''}`}
                title={collapsed ? user.username : ''}
              >
                <div className="user-avatar-sm" style={{ backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
                  {getInitials(user.username)}
                  <span className="status-dot online" />
                </div>
                <div className="user-info">
                  <div className="user-name-row">
                    <span className="user-name">{user.username}</span>
                    {isYou && <span className="you-badge">You</span>}
                    {isOwner && <FaCrown size={11} className="owner-icon" title="Room Owner" />}
                  </div>
                  <div className="user-meta">
                    <span className="user-status-text online-text">
                      ● {isOwner ? 'Owner' : 'Online'}
                    </span>
                    <span className="join-time">{getJoinTimeAgo(user.joinedAt, now)}</span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="empty-state">Chưa có ai trong phòng</div>
          )}

          {/* ── Offline Members ── */}
          {!collapsed && (() => {
            const onlineNames = onlineUsers.map(u => u.username);
            const offlineMembers = roomParticipants.filter(
              p => !onlineNames.includes(p.username)
            );
            if (offlineMembers.length === 0) return null;
            return (
              <>
                <div className="offline-divider">Offline — {offlineMembers.length}</div>
                {offlineMembers.map((member, idx) => {
                  const isOwner = member.username === roomOwner;
                  return (
                    <div key={member.id || idx} className="user-item offline">
                      <div className="user-avatar-sm" style={{ backgroundColor: '#484f58' }}>
                        {getInitials(member.username)}
                        <span className="status-dot offline" />
                      </div>
                      <div className="user-info">
                        <div className="user-name-row">
                          <span className="user-name">{member.username}</span>
                          {isOwner && <FaCrown size={11} className="owner-icon" title="Room Owner" />}
                        </div>
                        <div className="user-meta">
                          <span className="user-status-text offline-text">
                            ○ {isOwner ? 'Owner · Offline' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      )}

      {/* ── Tab: Chat ── */}
      {activeTab === 'chat' && !collapsed && (
        <div className="chat-area">
          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-state">Chưa có tin nhắn nào.<br />Hãy bắt đầu cuộc trò chuyện!</div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = socket && msg.socketId ? msg.socketId === socket.id : msg.username === currentUsername;
                const userIdx = onlineUsers.findIndex(u => u.username === msg.username);
                const color = AVATAR_COLORS[(userIdx >= 0 ? userIdx : idx) % AVATAR_COLORS.length];
                return (
                  <div key={idx} className={`chat-msg ${isMe ? 'me' : 'other'}`}>
                    {!isMe && (
                      <div className="chat-avatar" style={{ backgroundColor: color }}>
                        {getInitials(msg.username)}
                      </div>
                    )}
                    <div className="chat-bubble-wrap">
                      {!isMe && <div className="chat-sender">{msg.username}</div>}
                      <div className="chat-bubble">{msg.text}</div>
                      <div className="chat-time">{formatMsgTime(msg.timestamp)}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Nhắn tin..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!inputMsg.trim() || !isConnected}
              title="Gửi (Enter)"
            >
              <FiSend size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        <div className="online-summary">
          <span className="online-dot" />
          {!collapsed && <span>{onlineUsers.length} online</span>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

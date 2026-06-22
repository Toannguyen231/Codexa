import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.scss';
import { FiPlay, FiShare2, FiCopy, FiCheck, FiChevronDown, FiLogOut, FiUser, FiClock, FiArrowLeft, FiHome } from 'react-icons/fi';
import { LANGUAGE_VERSION, LANGUAGE_DISPLAY_NAME } from './constants';
import LanguageSelector from './LanguageSelector';
import EditorSettings from '../EditorSettings/EditorSettings';
import Avatar from '../Avatar/Avatar.jsx';
import '../Avatar/Avatar.scss';
import { FiSettings, FiZap } from 'react-icons/fi';

const CODEXA_LOGO = '/codexa-logo-transparent.png';

const Header = ({ onRun, isRunning, language, setLanguage, roomId, isConnected, onlineUsers = [], currentUser = {}, onOpenHistory, editorSettings, setEditorSettings, aiOpen, setAIOpen }) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const onlineUserList = onlineUsers.map((u, idx) => ({
    id: idx,
    name: u.username,
    initials: u.username ? u.username.slice(0, 2).toUpperCase() : '??',
    color: ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4'][idx % 6],
    online: true,
  }));

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId || 'ABC-123').catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const handleShare = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link).catch(() => { });
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('coderoom.problemStatuses'); // xóa cache trạng thái bài khi đăng xuất
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <header className="header">
      {/* LEFT */}
      <div className="header-left">
        <button className="back-to-menu" onClick={() => navigate('/rooms')} title="Quay về danh sách phòng">
          <FiArrowLeft size={16} />
        </button>

        <div className="logo">
          <div className="logo-icon"><img src={CODEXA_LOGO} alt="Codexa logo" /></div>
          <div className="logo-copy">
            <span>Codexa</span>
            <small>Instant Code. Boundless Data.</small>
          </div>
        </div>

        <div className="divider-v" />

        <div className="room-badge">
          <span className="room-label">Room</span>
          <span className="room-id">{roomId || 'ABC-123'}</span>
          <span className={`conn-dot ${isConnected ? 'connected' : ''}`} title={isConnected ? 'Connected' : 'Disconnected'} />
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy Room ID"
          >
            {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
          </button>
        </div>

        {/* Language selector */}
        <div className="lang-select-wrap">

          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
          />
          <FiChevronDown
            size={12}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}
          />
        </div>
      </div>

      {/* CENTER */}
      <div className="header-center">
        <button
          id="btn-run-code"
          className={`btn-run ${isRunning ? 'running' : ''}`}
          onClick={onRun}
          disabled={isRunning}
        >
          <FiPlay size={13} />
          {isRunning ? 'Running...' : 'Run Code'}
        </button>
      </div>

      {/* RIGHT */}
      <div className="header-right">
        <div className="user-avatars">
          {onlineUserList.filter((u) => u.online).map((u) => (
            <div
              key={u.id}
              className="user-avatar"
              style={{ backgroundColor: u.color }}
              title={`${u.name} (online)`}
            >
              {u.initials}
            </div>
          ))}
        </div>
        <span className="user-count-badge">
          {onlineUserList.filter((u) => u.online).length} online
        </span>

        <div className="divider-v" />

        <button id="btn-share" className={`btn-share ${copiedLink ? 'copied' : ''}`} onClick={handleShare}>
          {copiedLink ? <FiCheck size={13} /> : <FiShare2 size={13} />}
          {copiedLink ? 'Link copied!' : 'Share'}
        </button>

        <div className="divider-v" />

        <button className="btn-ai" onClick={() => setAIOpen(!aiOpen)} title="Gemini AI Assistant" style={{ color: '#a855f7' }}>
          <FiZap size={13} />
          AI Assistant
        </button>

        <div className="divider-v" />

        <button className="btn-history" onClick={onOpenHistory} title="Lịch sử code">
          <FiClock size={13} />
          History
        </button>

        <div className="divider-v" />

        <button className="btn-settings" onClick={() => setSettingsOpen(true)} title="Editor Settings">
          <FiSettings size={13} />
          Settings
        </button>

        <div className="divider-v" />

        {/* User Profile Dropdown */}
        <div className="profile-dropdown" ref={profileRef}>
          <button
            className="profile-trigger"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <Avatar user={currentUser} size="md" />
            <FiChevronDown size={12} />
          </button>

          {profileOpen && (
            <div className="profile-menu">
              <div className="profile-menu-header">
                <Avatar user={currentUser} size="lg" />
                <div className="profile-details">
                  <div className="profile-name">{currentUser.username || 'User'}</div>
                  <div className="profile-email">{currentUser.email || ''}</div>
                </div>
              </div>
              <div className="profile-menu-divider" />
              <button
                className="profile-menu-item"
                onClick={() => { setProfileOpen(false); navigate('/profile'); }}
              >
                <FiUser size={13} /> Profile
              </button>
              {currentUser.role === 'admin' && (
                <button
                  className="profile-menu-item"
                  onClick={() => { setProfileOpen(false); navigate('/admin'); }}
                >
                  <FiSettings size={13} /> Admin Panel
                </button>
              )}
              <button className="profile-menu-item logout" onClick={handleLogout}>
                <FiLogOut size={13} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
      
      {settingsOpen && (
        <EditorSettings 
          settings={editorSettings} 
          setSettings={setEditorSettings} 
          onClose={() => setSettingsOpen(false)} 
        />
      )}
    </header>
  );
};

export default Header;

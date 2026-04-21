import React, { useState } from 'react';
import './Header.scss';
import { FiPlay, FiShare2, FiCopy, FiCheck, FiChevronDown } from 'react-icons/fi';
import { LiaAccessibleIcon } from "react-icons/lia";
import { LANGUAGE_VERSION, LANGUAGE_DISPLAY_NAME } from './constants';
import LanguageSelector from './LanguageSelector';

const Header = ({ onRun, isRunning, language, setLanguage, roomId, isConnected, onlineUsers = [] }) => {
  const [copied, setCopied] = useState(false);

  const onlineUserList = onlineUsers.map((u, idx) => ({
    id: idx,
    name: u.username,
    initials: u.username ? u.username.slice(0, 2).toUpperCase() : '??',
    color: ['#4caf50', '#2196f3', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4'][idx % 6],
    online: true,
  }));

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId || 'ABC-123').catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const handleShare = () => {
    const link = `${window.location.origin}?room=${roomId || 'ABC-123'}`;
    navigator.clipboard.writeText(link).catch(() => { });
    alert(`🔗 Đã copy link tham gia:\n${link}`);
  };

  return (
    <header className="header">
      {/* LEFT */}
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon"><LiaAccessibleIcon size={24} color="#d7d4ceff" /></div>
          CodeRoom
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

        <button id="btn-share" className="btn-share" onClick={handleShare}>
          <FiShare2 size={13} />
          Share
        </button>
      </div>
    </header>
  );
};

export default Header;

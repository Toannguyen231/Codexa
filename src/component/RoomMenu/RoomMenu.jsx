import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiLogOut, FiRefreshCw, FiUsers, FiClock,
  FiCode, FiArrowRight, FiX, FiHash, FiLock, FiUnlock, FiEye, FiEyeOff
} from 'react-icons/fi';
import { LiaAccessibleIcon } from 'react-icons/lia';
import './RoomMenu.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??';

const RoomMenu = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [joinId, setJoinId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Password prompt modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState('');
  const [pendingRoomName, setPendingRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [showRoomPassword, setShowRoomPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Lấy thông tin user + token từ localStorage
  const token = localStorage.getItem('token') || '';
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; }
    catch { return {}; }
  })();

  // Nếu chưa login → redirect về trang login
  useEffect(() => {
    if (!token) navigate('/');
  }, [token, navigate]);

  // ── Fetch danh sách phòng ──────────────────────────────────────
  const fetchRooms = useCallback(async (searchTerm = '') => {
    try {
      const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`${API_URL}/rooms/all${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Lỗi tải danh sách phòng');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error('Fetch rooms error:', err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ── Search với debounce ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchRooms]);

  // ── Refresh ────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRooms(search);
    setTimeout(() => setRefreshing(false), 600);
  };

  // ── Tạo phòng mới ─────────────────────────────────────────────
  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRoomName.trim() || 'Untitled Room',
          password: newRoomPassword.trim() || '',
        }),
      });
      const data = await res.json();
      if (data.room) {
        navigate(`/room/${data.room.roomId}`);
      }
    } catch (err) {
      console.error('Create room error:', err);
    } finally {
      setCreating(false);
    }
  };

  // ── Join phòng (kiểm tra password nếu cần) ────────────────────
  const handleJoinRoom = async (roomId, roomName, isPrivate) => {
    if (!isPrivate) {
      navigate(`/room/${roomId}`);
      return;
    }
    // Nếu phòng private → kiểm tra user đã là participant chưa
    try {
      const res = await fetch(`${API_URL}/rooms/${roomId}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: '' }),
      });
      const data = await res.json();
      if (data.verified) {
        navigate(`/room/${roomId}`);
        return;
      }
    } catch { /* ignore */ }
    // Hiện modal nhập password
    setPendingRoomId(roomId);
    setPendingRoomName(roomName || roomId);
    setRoomPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  // ── Xác minh password & join ───────────────────────────────────
  const handleVerifyAndJoin = async () => {
    if (verifying) return;
    setVerifying(true);
    setPasswordError('');
    try {
      const res = await fetch(`${API_URL}/rooms/${pendingRoomId}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: roomPassword }),
      });
      const data = await res.json();
      if (data.verified) {
        setShowPasswordModal(false);
        navigate(`/room/${pendingRoomId}`);
      } else {
        setPasswordError(data.message || 'Mật khẩu sai.');
      }
    } catch {
      setPasswordError('Lỗi kết nối server.');
    } finally {
      setVerifying(false);
    }
  };

  // ── Join phòng bằng ID ────────────────────────────────────────
  const handleJoinById = async () => {
    const id = joinId.trim();
    if (!id) return;
    // Kiểm tra xem phòng có password không
    try {
      const res = await fetch(`${API_URL}/rooms/${id}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: '' }),
      });
      const data = await res.json();
      if (data.verified) {
        navigate(`/room/${id}`);
        return;
      }
    } catch { /* phòng không tồn tại hoặc cần password */ }
    // Hiện password modal
    setPendingRoomId(id);
    setPendingRoomName(id);
    setRoomPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  // ── Logout ─────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="room-menu">
      {/* ── Header ── */}
      <header className="rm-header">
        <div className="rm-header-left">
          <div className="rm-logo">
            <div className="rm-logo-icon">
              <LiaAccessibleIcon size={18} />
            </div>
            CodeRoom
          </div>
        </div>

        <div className="rm-header-right">
          <div className="rm-user-info">
            <div className="rm-user-avatar">
              {getInitials(currentUser.username)}
            </div>
            <span className="rm-user-name">{currentUser.username || 'User'}</span>
          </div>
          <button className="rm-btn-logout" onClick={handleLogout}>
            <FiLogOut size={13} /> Logout
          </button>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="rm-content">
        {/* Hero */}
        <div className="rm-hero">
          <h1>🚀 Chọn phòng để bắt đầu code</h1>
          <p>Tham gia phòng có sẵn hoặc tạo phòng mới để cùng nhau lập trình real-time</p>
        </div>

        {/* Action Bar */}
        <div className="rm-actions">
          <div className="rm-search-wrap">
            <FiSearch size={14} className="rm-search-icon" />
            <input
              className="rm-search"
              placeholder="Tìm kiếm phòng theo tên hoặc Room ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rm-join-wrap">
            <input
              className="rm-join-input"
              placeholder="Room ID"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinById()}
              maxLength={12}
            />
            <button
              className="rm-btn-join"
              onClick={handleJoinById}
              disabled={!joinId.trim()}
            >
              <FiArrowRight size={14} /> Join
            </button>
          </div>

          <button className="rm-btn-create" onClick={() => setShowCreate(true)}>
            <FiPlus size={15} /> Tạo phòng mới
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="rm-stats">
            <span className="rm-stats-count">
              <span>{rooms.length}</span> phòng {search ? 'tìm thấy' : 'hiện có'}
            </span>
            <button
              className={`rm-stats-refresh ${refreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
            >
              <FiRefreshCw size={12} /> Refresh
            </button>
          </div>
        )}

        {/* Room Grid */}
        {loading ? (
          <div className="rm-loading">
            <div className="rm-loading-spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Đang tải danh sách phòng...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="rm-empty">
            <div className="rm-empty-icon">📭</div>
            <h3>{search ? 'Không tìm thấy phòng nào' : 'Chưa có phòng nào'}</h3>
            <p>{search ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy tạo phòng mới để bắt đầu!'}</p>
          </div>
        ) : (
          <div className="rm-grid">
            {rooms.map((room) => (
              <div
                key={room.roomId || room._id}
                className={`rm-card ${room.isPrivate ? 'rm-card-private' : ''}`}
                onClick={() => handleJoinRoom(room.roomId, room.name, room.isPrivate)}
              >
                <div className="rm-card-top">
                  <div className="rm-card-info">
                    <div className="rm-card-name">
                      {room.isPrivate && <FiLock size={12} className="rm-lock-icon" />}
                      {room.name || 'Untitled Room'}
                    </div>
                    <div className="rm-card-id">
                      <FiHash size={10} />
                      {room.roomId}
                    </div>
                  </div>
                  <span className="rm-card-lang">{room.language || 'C++'}</span>
                </div>

                <div className="rm-card-meta">
                  <span className="rm-card-meta-item">
                    <FiUsers size={12} />
                    {room.participantCount || 0} thành viên
                  </span>
                  <span className="rm-card-meta-item">
                    <FiClock size={12} />
                    {timeAgo(room.updatedAt)}
                  </span>
                  {room.isPrivate && (
                    <span className="rm-card-meta-item rm-private-badge">
                      <FiLock size={10} /> Private
                    </span>
                  )}
                </div>

                <div className="rm-card-bottom">
                  <div className="rm-card-creator">
                    <div className="rm-card-creator-avatar">
                      {getInitials(room.creatorName)}
                    </div>
                    <span>{room.creatorName || 'Unknown'}</span>
                  </div>
                  <button
                    className="rm-btn-card-join"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinRoom(room.roomId, room.name, room.isPrivate);
                    }}
                  >
                    <FiCode size={12} /> Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Room Modal ── */}
      {showCreate && (
        <div className="rm-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="rm-modal">
            <div className="rm-modal-header">
              <h3><FiPlus size={16} /> Tạo phòng mới</h3>
              <button className="rm-modal-close" onClick={() => setShowCreate(false)}>
                <FiX size={16} />
              </button>
            </div>

            <div className="rm-modal-body">
              <div className="rm-modal-field">
                <label>Tên phòng</label>
                <input
                  type="text"
                  placeholder="VD: Nhóm 5 - Bài tập lớn"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  maxLength={50}
                  autoFocus
                />
              </div>

              <div className="rm-modal-field">
                <label>
                  <FiLock size={12} style={{ marginRight: 4 }} />
                  Mật khẩu phòng <span className="rm-optional">(tùy chọn)</span>
                </label>
                <div className="rm-password-wrap">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Để trống nếu phòng public"
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    maxLength={30}
                  />
                  <button
                    type="button"
                    className="rm-password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
                {newRoomPassword && (
                  <span className="rm-password-hint">
                    <FiLock size={10} /> Phòng sẽ yêu cầu mật khẩu để tham gia
                  </span>
                )}
              </div>

              <div className="rm-modal-actions">
                <button className="rm-modal-btn-cancel" onClick={() => { setShowCreate(false); setNewRoomPassword(''); }}>
                  Hủy
                </button>
                <button
                  className="rm-modal-btn-create"
                  onClick={handleCreate}
                  disabled={creating}
                >
                  {creating ? 'Đang tạo...' : (newRoomPassword ? '🔒 Tạo phòng Private' : 'Tạo phòng')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Password Prompt Modal ── */}
      {showPasswordModal && (
        <div className="rm-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPasswordModal(false)}>
          <div className="rm-modal rm-modal-password">
            <div className="rm-modal-header">
              <h3><FiLock size={16} /> Phòng yêu cầu mật khẩu</h3>
              <button className="rm-modal-close" onClick={() => setShowPasswordModal(false)}>
                <FiX size={16} />
              </button>
            </div>
            <div className="rm-modal-body">
              <p className="rm-password-room-name">
                Nhập mật khẩu để tham gia phòng <strong>{pendingRoomName}</strong>
              </p>
              <div className="rm-modal-field">
                <label>Mật khẩu</label>
                <div className="rm-password-wrap">
                  <input
                    type={showRoomPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu phòng..."
                    value={roomPassword}
                    onChange={(e) => { setRoomPassword(e.target.value); setPasswordError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyAndJoin()}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="rm-password-toggle"
                    onClick={() => setShowRoomPassword(!showRoomPassword)}
                  >
                    {showRoomPassword ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                </div>
                {passwordError && <span className="rm-password-error">{passwordError}</span>}
              </div>
              <div className="rm-modal-actions">
                <button className="rm-modal-btn-cancel" onClick={() => setShowPasswordModal(false)}>
                  Hủy
                </button>
                <button
                  className="rm-modal-btn-create"
                  onClick={handleVerifyAndJoin}
                  disabled={verifying || !roomPassword}
                >
                  {verifying ? 'Đang kiểm tra...' : '🔓 Tham gia'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomMenu;

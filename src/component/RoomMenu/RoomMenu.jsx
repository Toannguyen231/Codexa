import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiLogOut, FiRefreshCw, FiUsers, FiClock,
  FiCode, FiArrowRight, FiX, FiHash, FiLock, FiEye, FiEyeOff, FiUser, FiSettings, FiCrosshair
} from 'react-icons/fi';
import Avatar from '../Avatar/Avatar.jsx';
import '../Avatar/Avatar.scss';
import './RoomMenu.scss';
import DailyChallengeCard from '../Daily/DailyChallengeCard.jsx';
import '../Daily/DailyChallengeCard.scss';
import UserSearch from '../UserSearch/UserSearch.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const parseJsonResponse = async (res) => {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server trả về dữ liệu không hợp lệ (HTTP ${res.status}).`);
  }
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'vừa xong';
  if (diff < 3600) return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400) return Math.floor(diff / 3600) + ' giờ trước';
  if (diff < 604800) return Math.floor(diff / 86400) + ' ngày trước';
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const getInitials = (name) => name ? name.slice(0, 2).toUpperCase() : '??';

const RoomMenu = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
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
  const [onlineCount, setOnlineCount] = useState(0);

  // Password prompt modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState('');
  const [pendingRoomName, setPendingRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [showRoomPassword, setShowRoomPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Lay thong tin user + token tu localStorage
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; }
    catch { return {}; }
  });

  // Sync user khi có thay đổi từ Profile hoặc tab khác
  useEffect(() => {
    const syncUser = () => {
      try { setCurrentUser(JSON.parse(localStorage.getItem('user')) || {}); }
      catch { setCurrentUser({}); }
    };
    window.addEventListener('storage', (e) => { if (e.key === 'user') syncUser(); });
    window.addEventListener('user-updated', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-updated', syncUser);
    };
  }, []);

  // Neu chua login -> redirect ve trang login
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // Fetch danh sach phong
  const fetchRooms = useCallback(async (searchTerm = '') => {
    try {
      const query = searchTerm ? '?search=' + encodeURIComponent(searchTerm) : '';
      const res = await fetch(API_URL + '/rooms/all' + query, {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) throw new Error('Lỗi tải danh sách phòng');
      const data = await parseJsonResponse(res);
      setRooms(data.rooms || []);
      let users = 0;
      (data.rooms || []).forEach(r => { users += (r.participantCount || 0); });
      setOnlineCount(users + 1);
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

  // Search voi debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchRooms]);

  // Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRooms(search);
    setTimeout(() => setRefreshing(false), 600);
  };

  // Tạo phòng mới
  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch(API_URL + '/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          name: newRoomName.trim() || 'Untitled Room',
          password: newRoomPassword.trim() || '',
          language: settings?.defaultLanguage || 'C++',
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.message || 'Không thể tạo phòng.');
      if (data.room) {
        navigate('/room/' + data.room.roomId);
      }
    } catch (err) {
      console.error('Create room error:', err);
    } finally {
      setCreating(false);
    }
  };

  // Join phong (kiem tra password neu can)
  const handleJoinRoom = async (roomId, roomName, isPrivate) => {
    if (!isPrivate) {
      navigate('/room/' + roomId);
      return;
    }
    try {
      const res = await fetch(API_URL + '/rooms/' + roomId + '/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ password: '' }),
      });
      const data = await parseJsonResponse(res);
      if (data.verified) {
        navigate('/room/' + roomId);
        return;
      }
    } catch {
      // Private rooms fall back to asking for a password.
    }
    setPendingRoomId(roomId);
    setPendingRoomName(roomName || roomId);
    setRoomPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleVerifyAndJoin = async () => {
    if (verifying) return;
    setVerifying(true);
    setPasswordError('');
    try {
      const res = await fetch(API_URL + '/rooms/' + pendingRoomId + '/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ password: roomPassword }),
      });
      const data = await parseJsonResponse(res);
      if (data.verified) {
        setShowPasswordModal(false);
        navigate('/room/' + pendingRoomId);
      } else {
        setPasswordError(data.message || 'Mật khẩu sai.');
      }
    } catch {
      setPasswordError('Lỗi kết nối server.');
    } finally {
      setVerifying(false);
    }
  };

  const handleJoinById = async () => {
    const id = joinId.trim();
    if (!id) return;
    try {
      const res = await fetch(API_URL + '/rooms/' + id + '/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ password: '' }),
      });
      const data = await parseJsonResponse(res);
      if (data.verified) {
        navigate('/room/' + id);
        return;
      }
    } catch {
      // Unknown/private room ids fall back to the password prompt.
    }
    setPendingRoomId(id);
    setPendingRoomName(id);
    setRoomPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('coderoom.problemStatuses');
    navigate('/');
  };

  return (
    <div className="rm-layout">
      {/* NAV */}
      <nav className="rm-nav">
        <div className="rm-wrap rm-nav-inner">
          <div className="rm-brand" onClick={() => navigate('/')}>
            <div className="rm-brand-mark">&lt;/&gt;</div>
            <div className="rm-brand-text"><b>Codexa</b><span>INSTANT CODE. BOUNDLESS DATA.</span></div>
          </div>
          <div className="rm-nav-links">
            {currentUser.role === 'admin' && (
              <Link to="/admin">
                <FiSettings /> Admin Panel
              </Link>
            )}
            <Link to="/battle" className="rm-battle">
              <FiCrosshair /> Battle
            </Link>
            <Link to="/problems">
              <FiCode /> Problems
            </Link>
          </div>
          <div className="rm-nav-right">
            <UserSearch />
            <button className="rm-icon-btn" onClick={() => navigate('/settings')} title="Cài đặt">
              <FiSettings />
            </button>
            <div className="rm-avatar-chip" onClick={() => navigate('/profile')}>
              <div className="rm-dot">{getInitials(currentUser.username)}</div>
              {currentUser.username || 'User'}
            </div>
            <button className="rm-icon-btn" onClick={handleLogout} title="Đăng xuất">
              <FiLogOut />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="rm-hero">
        <div className="rm-wrap rm-hero-grid">
          <div>
            <div className="rm-eyebrow"><span className="rm-pulse"></span>{rooms.length} phòng đang hoạt động ngay bây giờ</div>
            <h1 className="rm-hero-title">Code cùng nhau,<br/><span className="rm-grad">theo thời gian thực.</span></h1>
            <p className="rm-hero-sub">Vào phòng có sẵn hoặc tạo phòng mới để lập trình real-time cùng bạn bè, hoặc bước vào Battle Arena để đối đầu 1v1 và leo hạng.</p>
            <div className="rm-hero-ctas">
              <button className="rm-btn rm-btn-primary" onClick={() => setShowCreate(true)}>
                <FiPlus /> Tạo phòng mới
              </button>
              <button className="rm-btn rm-btn-ghost" onClick={() => navigate('/battle')}>
                <FiCrosshair /> Vào Battle Arena
              </button>
            </div>
            <div className="rm-hero-stats">
              <div><b>{rooms.length}</b><span>Phòng hiện có</span></div>
              <div><b>{onlineCount}</b><span>Người đang online</span></div>
              <div><b>Sat &#8594; Boss</b><span>9 bậc xếp hạng</span></div>
            </div>
          </div>

          <div className="rm-battle-visual">
            <div className="rm-term rm-term-a">
              <div className="rm-term-head"><span></span><span></span><span></span><div className="rm-term-tag">PLAYER 1</div></div>
              <div className="rm-term-body">
                <span className="c4">1</span>  <span className="c1">function</span> solve(arr) &#123;<br/>
                <span className="c4">2</span>    <span className="c1">let</span> sum = <span className="c3">0</span>;<br/>
                <span className="c4">3</span>    <span className="c1">for</span> (x <span className="c1">of</span> arr)<br/>
                <span className="c4">4</span>      sum += x;<br/>
                <span className="c4">5</span>    <span className="c1">return</span> sum;<span className="cursor"></span><br/>
                <span className="c4">6</span>  &#125;
              </div>
            </div>
            <div className="rm-term rm-term-b">
              <div className="rm-term-head"><span></span><span></span><span></span><div className="rm-term-tag">PLAYER 2</div></div>
              <div className="rm-term-body">
                <span className="c4">1</span>  <span className="c1">int</span> solve(<span className="c1">vector&lt;int&gt;</span>&amp; v) &#123;<br/>
                <span className="c4">2</span>    <span className="c1">int</span> s = <span className="c3">0</span>;<br/>
                <span className="c4">3</span>    <span className="c1">for</span> (<span className="c1">auto</span> x : v)<br/>
                <span className="c4">4</span>      s += x;<br/>
                <span className="c4">5</span>    <span className="c2">return</span> s;<span className="cursor"></span><br/>
                <span className="c4">6</span>  &#125;
              </div>
            </div>
            <div className="rm-vs-badge">VS</div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="rm-wrap rm-main">
        <div className="rm-panel"><div className="rm-panel-inner">
          <DailyChallengeCard />
        </div></div>

        <div className="rm-room-tools">
          <div className="rm-field" style={{ flex: 1 }}>
            <FiSearch />
            <input 
              placeholder="Tìm kiếm phòng theo tên hoặc Room ID…" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="rm-field rm-field-room-id">
            <input 
              placeholder="Room ID" 
              value={joinId}
              onChange={(e) => setJoinId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinById()}
              maxLength={12}
            />
          </div>
          <button className="rm-btn rm-btn-ghost" onClick={handleJoinById} disabled={!joinId.trim()}>Join &#8594;</button>
        </div>

        <div className="rm-section-head">
          <h4><b>{rooms.length}</b> phong {search ? 'tìm thấy' : 'hiện có'}</h4>
          <button className={'rm-refresh-btn ' + (refreshing ? 'spinning' : '')} onClick={handleRefresh}>
            <FiRefreshCw /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>Đang tải danh sách phòng...</div>
        ) : rooms.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>&#128701;</div>
            <h4>{search ? 'Khong tìm thấy phong nao' : 'Chưa có phòng nào hoạt động'}</h4>
          </div>
        ) : (
          <div className="rm-rooms">
            {rooms.map((room) => (
              <div 
                key={room.roomId} 
                className={'rm-room-card ' + (room.isPrivate ? 'is-private' : '')}
                onClick={() => handleJoinRoom(room.roomId, room.name, room.isPrivate)}
              >
                <div className="rm-room-top">
                  <h5>{room.name || 'Untitled Room'}</h5>
                  <span className="rm-lang-tag">{room.language || 'C++'}</span>
                </div>
                <div className="rm-room-id"># {room.roomId}</div>
                <div className="rm-room-meta">
                  <span><FiUsers /> {room.participantCount || 0} thành viên</span>
                  <span><FiClock /> {timeAgo(room.updatedAt)}</span>
                </div>
                <div className="rm-room-join">
                  {room.isPrivate ? <><FiLock style={{marginRight: '6px', verticalAlign: '-2px'}}/> Join Private Room</> : 'Vào phòng'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreate && (
        <div className="rm-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="rm-modal">
            <div className="rm-modal-header">
              <h3><FiPlus /> Tạo phòng mới</h3>
              <button className="rm-modal-close" onClick={() => setShowCreate(false)}><FiX size={20} /></button>
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
                <label>Mật khẩu phòng <span style={{color: 'var(--text-faint)', fontWeight: 'normal'}}>(tùy chọn)</span></label>
                <div className="rm-password-wrap">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Để trống nếu public"
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    maxLength={30}
                  />
                  <button type="button" className="rm-password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {newRoomPassword && <span className="rm-password-hint"><FiLock /> Phòng sẽ yêu cầu mật khẩu để 🔓 Tham gia</span>}
              </div>
              <div className="rm-modal-actions">
                <button className="rm-modal-btn-cancel" onClick={() => setShowCreate(false)}>Hủy</button>
                <button className="rm-modal-btn-create" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Đang tạo...' : (newRoomPassword ? 'Tạo phòng Private' : 'Tạo phòng')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Prompt Modal */}
      {showPasswordModal && (
        <div className="rm-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPasswordModal(false)}>
          <div className="rm-modal">
            <div className="rm-modal-header">
              <h3><FiLock /> Yêu cầu mật khẩu</h3>
              <button className="rm-modal-close" onClick={() => setShowPasswordModal(false)}><FiX size={20} /></button>
            </div>
            <div className="rm-modal-body">
              <p className="rm-password-room-name">Nhập mật khẩu để 🔓 Tham gia phòng <strong>{pendingRoomName}</strong></p>
              <div className="rm-modal-field">
                <label>Mật khẩu</label>
                <div className="rm-password-wrap">
                  <input
                    type={showRoomPassword ? 'text' : 'password'}
                    placeholder="Nhap Mật khẩu..."
                    value={roomPassword}
                    onChange={(e) => { setRoomPassword(e.target.value); setPasswordError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyAndJoin()}
                    autoFocus
                  />
                  <button type="button" className="rm-password-toggle" onClick={() => setShowRoomPassword(!showRoomPassword)}>
                    {showRoomPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {passwordError && <span className="rm-password-error">{passwordError}</span>}
              </div>
              <div className="rm-modal-actions">
                <button className="rm-modal-btn-cancel" onClick={() => setShowPasswordModal(false)}>Hủy</button>
                <button className="rm-modal-btn-create" onClick={handleVerifyAndJoin} disabled={verifying || !roomPassword}>
                  {verifying ? 'Kiểm tra...' : '🔓 Tham gia'}
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

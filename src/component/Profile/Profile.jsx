import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { getMe, updateProfile, updateAvatar, deleteAvatar, changePassword } from './api';
import { resolveAvatar } from '../../utils/avatar';
import './Profile.scss';

const Profile = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }

    getMe()
      .then((u) => { setUser(u); setUsername(u.username || ''); setBio(u.bio || ''); })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const syncLocalUser = (updated) => {
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const clearAlerts = () => { setMsg(''); setErr(''); };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) { setErr('Ảnh tối đa 500KB'); setMsg(''); return; }

    const reader = new FileReader();
    reader.onload = async () => {
      clearAlerts();
      try {
        const updated = await updateAvatar(reader.result);
        syncLocalUser(updated);
        setMsg('Cập nhật avatar thành công');
      } catch (ex) { setErr(ex.message); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    clearAlerts();
    try {
      const updated = await deleteAvatar();
      syncLocalUser(updated);
      setMsg('Đã xóa avatar');
    } catch (ex) { setErr(ex.message); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    clearAlerts();
    setSaving(true);
    try {
      const updated = await updateProfile({ username, bio });
      syncLocalUser(updated);
      setMsg('Lưu thành công');
    } catch (ex) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    clearAlerts();
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setMsg('Đổi mật khẩu thành công');
    } catch (ex) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="profile-loading">Đang tải...</div>;

  const avatar = resolveAvatar(user);

  return (
    <div className="profile-page">
      <header className="profile-header">
        <button type="button" onClick={() => navigate('/rooms')}>
          <FiArrowLeft size={14} /> Quay lại
        </button>
        <h1>Profile</h1>
      </header>

      {msg && <div className="profile-alert success">{msg}</div>}
      {err && <div className="profile-alert error">{err}</div>}

      <div className="profile-body">
        <section className="profile-avatar-section">
          <div className="profile-avatar-wrap">
            {avatar.type === 'image' ? (
              <img src={avatar.src} alt="avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-initials" style={{ background: avatar.color }}>
                {avatar.initials}
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
          <div className="profile-avatar-actions">
            <button type="button" onClick={() => fileRef.current?.click()}>Đổi avatar</button>
            {user.avatar && (
              <button type="button" className="btn-danger" onClick={handleRemoveAvatar}>Xóa avatar</button>
            )}
          </div>
        </section>

        <div className="profile-main">
      <form className="profile-form" onSubmit={handleSaveProfile}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          minLength={3}
          maxLength={30}
          required
        />
        <label htmlFor="email">Email</label>
        <input id="email" value={user.email} disabled />
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          placeholder="Giới thiệu ngắn về bạn..."
        />
        <div className="profile-char-count">{bio.length}/200</div>
        {user.createdAt && (
          <div className="profile-meta">
            Tham gia: {new Date(user.createdAt).toLocaleDateString('vi-VN')}
          </div>
        )}
        <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </form>

      <form className="profile-form" onSubmit={handleChangePassword}>
        <h2>Đổi mật khẩu</h2>
        <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <label htmlFor="newPassword">Mật khẩu mới</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={saving}>{saving ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
      </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

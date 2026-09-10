import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiUser, FiSun, FiBell, FiMonitor, FiLock, FiCheck,
  FiChevronRight, FiLogOut, FiTrash2, FiCode, FiVolume2, FiShield,
  FiGlobe, FiGithub, FiRefreshCw
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useSettings } from '../../contexts/SettingsContext.jsx';
import { changePassword } from '../Profile/api.jsx';
import './Settings.scss';

const SECTIONS = [
  { id: 'appearance', label: 'Giao diện', icon: FiSun },
  { id: 'editor', label: 'Code Editor', icon: FiCode },
  { id: 'sound', label: 'Âm thanh', icon: FiVolume2 },
  { id: 'privacy', label: 'Quyền riêng tư', icon: FiShield },
  { id: 'localization', label: 'Ngôn ngữ', icon: FiGlobe },
  { id: 'notifications', label: 'Thông báo', icon: FiBell },
  { id: 'account', label: 'Tài khoản', icon: FiUser },
  { id: 'sessions', label: 'Phiên đăng nhập', icon: FiMonitor },
];

const LANGUAGES = [
  { value: 'cpp', label: 'C++', icon: '⚡' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'javascript', label: 'Javascript', icon: '🟨' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'csharp', label: 'C#', icon: '🔷' },
  { value: 'go', label: 'Go', icon: '🐹' },
];

const KEYBINDINGS = [
  { value: 'standard', label: 'Tiêu chuẩn', desc: 'Bàn phím mặc định' },
  { value: 'vim', label: 'Vim', desc: 'Chế độ modal Vim' },
  { value: 'emacs', label: 'Emacs', desc: 'Phím tắt Emacs' },
];

const TIMEZONES = [
  { value: 'Asia/Ho_Chi_Minh', label: '(GMT+7) Hồ Chí Minh' },
  { value: 'Asia/Bangkok', label: '(GMT+7) Bangkok' },
  { value: 'Asia/Tokyo', label: '(GMT+9) Tokyo' },
  { value: 'Asia/Seoul', label: '(GMT+9) Seoul' },
  { value: 'Asia/Singapore', label: '(GMT+8) Singapore' },
  { value: 'Asia/Shanghai', label: '(GMT+8) Shanghai' },
  { value: 'Europe/London', label: '(GMT+0) London' },
  { value: 'America/New_York', label: '(GMT-5) New York' },
  { value: 'America/Los_Angeles', label: '(GMT-8) Los Angeles' },
  { value: 'Pacific/Auckland', label: '(GMT+12) Auckland' },
];

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme, themes } = useTheme();
  const { settings, updateSetting, resetSettings } = useSettings();
  const [activeSection, setActiveSection] = useState('appearance');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Account - Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // User info
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; }
    catch { return {}; }
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) { navigate('/'); }
  }, [navigate]);

  useEffect(() => {
    const sync = () => {
      try { setUser(JSON.parse(localStorage.getItem('user')) || {}); }
      catch { setUser({}); }
    };
    window.addEventListener('user-updated', sync);
    window.addEventListener('storage', (e) => { if (e.key === 'user') sync(); });
    return () => {
      window.removeEventListener('user-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(''); setPwErr('');
    if (newPassword !== confirmPassword) { setPwErr('Mật khẩu mới không khớp'); return; }
    if (newPassword.length < 6) { setPwErr('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    setPwSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPwMsg('Đổi mật khẩu thành công!');
    } catch (ex) {
      setPwErr(ex.message || 'Có lỗi xảy ra');
    } finally { setPwSaving(false); }
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    setMobileSidebarOpen(false);
  };

  /* ═══════════════════════════════════════════════
     SECTION: Appearance (Theme)
     ═══════════════════════════════════════════════ */
  const renderAppearance = () => (
    <div className="settings-section" id="settings-appearance">
      <div className="settings-section-header">
        <FiSun className="section-icon" />
        <div>
          <h2>Giao diện</h2>
          <p>Tùy chỉnh giao diện của Codexa theo phong cách của bạn</p>
        </div>
      </div>
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Theme</h3>
          <span className="current-theme-badge">{themes.find(t => t.id === theme)?.name}</span>
        </div>
        <div className="settings-card-body">
          <div className="theme-grid">
            {themes.map((t) => (
              <button
                key={t.id}
                className={`theme-card ${theme === t.id ? 'active' : ''}`}
                onClick={() => setTheme(t.id)}
                id={`theme-${t.id}`}
              >
                <div className="theme-preview" style={{ background: t.preview.bg }}>
                  <div className="preview-header" style={{ background: t.preview.card, borderBottom: `1px solid ${t.preview.accent}33` }}>
                    <div className="preview-dots">
                      <span style={{ background: '#ff5f57' }} />
                      <span style={{ background: '#febc2e' }} />
                      <span style={{ background: '#28c840' }} />
                    </div>
                  </div>
                  <div className="preview-body">
                    <div className="preview-sidebar" style={{ background: t.preview.card }}>
                      <div className="preview-sidebar-item" style={{ background: `${t.preview.accent}33` }} />
                      <div className="preview-sidebar-item" style={{ background: `${t.preview.text}15` }} />
                      <div className="preview-sidebar-item" style={{ background: `${t.preview.text}15` }} />
                    </div>
                    <div className="preview-content">
                      <div className="preview-line" style={{ background: `${t.preview.text}25`, width: '80%' }} />
                      <div className="preview-line" style={{ background: `${t.preview.accent}40`, width: '60%' }} />
                      <div className="preview-line" style={{ background: `${t.preview.text}15`, width: '90%' }} />
                      <div className="preview-line" style={{ background: `${t.preview.text}20`, width: '45%' }} />
                    </div>
                  </div>
                </div>
                <div className="theme-info">
                  <div className="theme-name-row">
                    <span className="theme-name">{t.name}</span>
                    {theme === t.id && (
                      <span className="theme-active-check"><FiCheck size={12} /></span>
                    )}
                  </div>
                  <span className="theme-desc">{t.description}</span>
                </div>
                <div className="theme-swatches">
                  <span className="swatch" style={{ background: t.preview.bg }} title="Background" />
                  <span className="swatch" style={{ background: t.preview.card }} title="Card" />
                  <span className="swatch" style={{ background: t.preview.accent }} title="Accent" />
                  <span className="swatch" style={{ background: t.preview.text }} title="Text" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════
     SECTION: Code Editor Preferences
     ═══════════════════════════════════════════════ */
  const renderEditor = () => (
    <div className="settings-section" id="settings-editor">
      <div className="settings-section-header">
        <FiCode className="section-icon" />
        <div>
          <h2>Code Editor</h2>
          <p>Tùy chỉnh trải nghiệm gõ code trong phòng luyện tập và trận đấu</p>
        </div>
      </div>

      {/* Default Language */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Ngôn ngữ mặc định</h3>
          <span className="current-theme-badge">
            {LANGUAGES.find(l => l.value === settings.defaultLanguage)?.label}
          </span>
        </div>
        <div className="settings-card-body">
          <p className="setting-description">
            Khi tạo phòng mới hoặc bắt đầu trận đấu, ngôn ngữ này sẽ được tự động chọn sẵn.
          </p>
          <div className="language-grid">
            {LANGUAGES.map(lang => (
              <button
                key={lang.value}
                className={`language-card ${settings.defaultLanguage === lang.value ? 'active' : ''}`}
                onClick={() => updateSetting('defaultLanguage', lang.value)}
                id={`lang-${lang.value}`}
              >
                <span className="language-icon">{lang.icon}</span>
                <span className="language-name">{lang.label}</span>
                {settings.defaultLanguage === lang.value && (
                  <span className="language-check"><FiCheck size={12} /></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Font Size */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Cỡ chữ Editor</h3>
          <span className="current-theme-badge">{settings.editorFontSize}px</span>
        </div>
        <div className="settings-card-body">
          <div className="slider-control">
            <div className="slider-labels">
              <span>12px</span>
              <span className="slider-current">{settings.editorFontSize}px</span>
              <span>22px</span>
            </div>
            <input
              type="range"
              min={12}
              max={22}
              step={1}
              value={settings.editorFontSize}
              onChange={(e) => updateSetting('editorFontSize', parseInt(e.target.value))}
              className="settings-slider"
              id="editor-font-size"
            />
            <div className="font-preview" style={{ fontSize: `${settings.editorFontSize}px` }}>
              <code>function solve(n) {'{'}</code>
              <code>  return n * (n + 1) / 2;</code>
              <code>{'}'}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Size */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Kích thước Tab</h3>
        </div>
        <div className="settings-card-body">
          <div className="tab-size-options">
            {[2, 4].map(size => (
              <button
                key={size}
                className={`tab-size-btn ${settings.tabSize === size ? 'active' : ''}`}
                onClick={() => updateSetting('tabSize', size)}
                id={`tab-size-${size}`}
              >
                <span className="tab-size-value">{size}</span>
                <span className="tab-size-label">{size === 2 ? '2 spaces' : '4 spaces'}</span>
                {settings.tabSize === size && <FiCheck size={14} className="tab-check" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keybinding */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Phím tắt (Keybinding)</h3>
        </div>
        <div className="settings-card-body">
          <div className="keybinding-options">
            {KEYBINDINGS.map(kb => (
              <button
                key={kb.value}
                className={`keybinding-card ${settings.keybinding === kb.value ? 'active' : ''}`}
                onClick={() => updateSetting('keybinding', kb.value)}
                id={`keybinding-${kb.value}`}
              >
                <div className="keybinding-info">
                  <span className="keybinding-name">{kb.label}</span>
                  <span className="keybinding-desc">{kb.desc}</span>
                </div>
                {settings.keybinding === kb.value && (
                  <span className="keybinding-check"><FiCheck size={14} /></span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════
     SECTION: Sound & Interactive
     ═══════════════════════════════════════════════ */
  const renderSound = () => (
    <div className="settings-section" id="settings-sound">
      <div className="settings-section-header">
        <FiVolume2 className="section-icon" />
        <div>
          <h2>Âm thanh & Hiệu ứng</h2>
          <p>Điều chỉnh âm thanh và hiệu ứng trong trận đấu và phòng code</p>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Tùy chọn âm thanh</h3>
        </div>
        <div className="settings-card-body">
          <div className="toggle-group">
            <div className="toggle-item">
              <div className="toggle-info">
                <h4>💬 Âm thanh Chat</h4>
                <p>Phát tiếng thông báo khi có tin nhắn mới trong phòng code</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.soundChat}
                  onChange={(e) => updateSetting('soundChat', e.target.checked)}
                  id="toggle-sound-chat"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <h4>⚔️ Âm thanh Trận đấu</h4>
                <p>Thông báo khi đối thủ giải xong bài hoặc khi thời gian sắp hết (10 giây cuối)</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.soundBattle}
                  onChange={(e) => updateSetting('soundBattle', e.target.checked)}
                  id="toggle-sound-battle"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <h4>🎉 Hiệu ứng đặc biệt</h4>
                <p>Bật pháo giấy (Confetti) khi thắng trận, hoàn thành streak, hoặc đạt thành tựu</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.soundEffects}
                  onChange={(e) => updateSetting('soundEffects', e.target.checked)}
                  id="toggle-sound-effects"
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════
     SECTION: Privacy & Connections
     ═══════════════════════════════════════════════ */
  const renderPrivacy = () => (
    <div className="settings-section" id="settings-privacy">
      <div className="settings-section-header">
        <FiShield className="section-icon" />
        <div>
          <h2>Quyền riêng tư</h2>
          <p>Kiểm soát ai có thể nhìn thấy hoạt động và thông tin của bạn</p>
        </div>
      </div>

      {/* Privacy Toggles */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Chế độ riêng tư</h3>
        </div>
        <div className="settings-card-body">
          <div className="toggle-group">
            <div className="toggle-item">
              <div className="toggle-info">
                <h4>👻 Chế độ ẩn danh</h4>
                <p>Ẩn trạng thái "Đang online" trên bảng xếp hạng và trang hồ sơ</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.invisibleMode}
                  onChange={(e) => updateSetting('invisibleMode', e.target.checked)}
                  id="toggle-invisible"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <h4>📊 Hiển thị lịch sử giải bài</h4>
                <p>Cho phép người khác xem Heatmap và lịch sử giải bài trên hồ sơ công khai</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showHeatmap}
                  onChange={(e) => updateSetting('showHeatmap', e.target.checked)}
                  id="toggle-heatmap"
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <div className="toggle-item">
              <div className="toggle-info">
                <h4>⚔️ Cho phép lời mời Battle</h4>
                <p>Cho phép người lạ gửi lời mời tham gia trận đấu cho bạn</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.allowBattleInvites}
                  onChange={(e) => updateSetting('allowBattleInvites', e.target.checked)}
                  id="toggle-battle-invites"
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Accounts */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Tài khoản liên kết</h3>
        </div>
        <div className="settings-card-body">
          <div className="linked-accounts">
            <div className="linked-account-item">
              <div className="linked-account-info">
                <FiGithub size={20} className="linked-icon github" />
                <div>
                  <h4>GitHub</h4>
                  <p>Chưa liên kết</p>
                </div>
              </div>
              <button className="btn-outline-settings" disabled title="Tính năng sẽ sớm ra mắt">
                Liên kết
              </button>
            </div>
            <div className="linked-account-item">
              <div className="linked-account-info">
                <FcGoogle size={20} className="linked-icon" />
                <div>
                  <h4>Google</h4>
                  <p>{user.email ? `Đã liên kết: ${user.email}` : 'Chưa liên kết'}</p>
                </div>
              </div>
              <button className="btn-outline-settings" disabled>
                {user.email ? 'Đã kết nối' : 'Liên kết'}
              </button>
            </div>
          </div>
          <p className="coming-soon-note">🚧 Liên kết tài khoản sẽ sớm hỗ trợ đầy đủ</p>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════
     SECTION: Localization
     ═══════════════════════════════════════════════ */
  const renderLocalization = () => (
    <div className="settings-section" id="settings-localization">
      <div className="settings-section-header">
        <FiGlobe className="section-icon" />
        <div>
          <h2>Ngôn ngữ & Khu vực</h2>
          <p>Thay đổi ngôn ngữ hiển thị và múi giờ cho hệ thống</p>
        </div>
      </div>

      {/* Language */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Ngôn ngữ hệ thống</h3>
        </div>
        <div className="settings-card-body">
          <div className="locale-options">
            {[
              { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
              { value: 'en', label: 'English', flag: '🇬🇧' },
            ].map(loc => (
              <button
                key={loc.value}
                className={`locale-card ${settings.language === loc.value ? 'active' : ''}`}
                onClick={() => updateSetting('language', loc.value)}
                id={`locale-${loc.value}`}
              >
                <span className="locale-flag">{loc.flag}</span>
                <span className="locale-name">{loc.label}</span>
                {settings.language === loc.value && (
                  <span className="locale-check"><FiCheck size={14} /></span>
                )}
              </button>
            ))}
          </div>
          <p className="coming-soon-note">🚧 Bản dịch tiếng Anh sẽ sớm hoàn thiện</p>
        </div>
      </div>

      {/* Timezone */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Múi giờ</h3>
          <span className="current-theme-badge">
            {TIMEZONES.find(tz => tz.value === settings.timezone)?.label}
          </span>
        </div>
        <div className="settings-card-body">
          <p className="setting-description">
            Ảnh hưởng đến thời gian hiển thị Daily Challenge, Heatmap và lịch sử hoạt động.
          </p>
          <div className="form-group">
            <select
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
              className="settings-select"
              id="timezone-select"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════
     SECTION: Notifications
     ═══════════════════════════════════════════════ */
  const renderNotifications = () => (
    <div className="settings-section" id="settings-notifications">
      <div className="settings-section-header">
        <FiBell className="section-icon" />
        <div>
          <h2>Thông báo</h2>
          <p>Quản lý cách bạn nhận thông báo</p>
        </div>
      </div>
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Tùy chọn thông báo</h3>
        </div>
        <div className="settings-card-body">
          <div className="toggle-group">
            <div className="toggle-item">
              <div className="toggle-info">
                <h4>🔔 Thông báo trong app</h4>
                <p>Nhận thông báo khi có người tham gia phòng của bạn</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked disabled />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="toggle-item">
              <div className="toggle-info">
                <h4>📧 Thông báo Email</h4>
                <p>Nhận email tổng hợp hoạt động hàng tuần</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" disabled />
                <span className="toggle-slider" />
              </label>
            </div>
            <div className="toggle-item">
              <div className="toggle-info">
                <h4>⚔️ Thông báo Battle</h4>
                <p>Nhận thông báo khi có lời mời Battle</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" defaultChecked disabled />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
          <p className="coming-soon-note">🚧 Tính năng thông báo sẽ sớm ra mắt</p>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════
     SECTION: Account
     ═══════════════════════════════════════════════ */
  const renderAccount = () => (
    <div className="settings-section" id="settings-account">
      <div className="settings-section-header">
        <FiUser className="section-icon" />
        <div>
          <h2>Tài khoản</h2>
          <p>Quản lý thông tin bảo mật tài khoản của bạn</p>
        </div>
      </div>

      {/* Email */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Địa chỉ Email</h3>
        </div>
        <div className="settings-card-body">
          <div className="settings-field-readonly">
            <span className="field-label">Email</span>
            <span className="field-value">{user.email || 'Chưa có email'}</span>
          </div>
          <p className="field-note">Email không thể thay đổi. Liên hệ admin nếu cần hỗ trợ.</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="settings-card">
        <div className="settings-card-header">
          <FiLock className="card-icon" />
          <h3>Đổi mật khẩu</h3>
        </div>
        <div className="settings-card-body">
          {pwMsg && <div className="settings-alert success">{pwMsg}</div>}
          {pwErr && <div className="settings-alert error">{pwErr}</div>}
          <form onSubmit={handleChangePassword} className="settings-form">
            <div className="form-group">
              <label htmlFor="settings-current-pw">Mật khẩu hiện tại</label>
              <input id="settings-current-pw" type="password" value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Nhập mật khẩu hiện tại" required />
            </div>
            <div className="form-group">
              <label htmlFor="settings-new-pw">Mật khẩu mới</label>
              <input id="settings-new-pw" type="password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)" minLength={6} required />
            </div>
            <div className="form-group">
              <label htmlFor="settings-confirm-pw">Xác nhận mật khẩu mới</label>
              <input id="settings-confirm-pw" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" minLength={6} required />
            </div>
            <button type="submit" className="btn-primary-settings" disabled={pwSaving}>
              {pwSaving ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      </div>

      {/* Reset Settings */}
      <div className="settings-card">
        <div className="settings-card-header">
          <FiRefreshCw className="card-icon" />
          <h3>Đặt lại cài đặt</h3>
        </div>
        <div className="settings-card-body">
          <div className="danger-item">
            <div>
              <h4>Khôi phục mặc định</h4>
              <p>Đặt lại tất cả tùy chọn Code Editor, Âm thanh, Quyền riêng tư về giá trị ban đầu. Theme sẽ không bị ảnh hưởng.</p>
            </div>
            <button className="btn-outline-settings" onClick={resetSettings}>
              <FiRefreshCw size={14} />
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-card danger-zone">
        <div className="settings-card-header">
          <FiTrash2 className="card-icon danger" />
          <h3>Vùng nguy hiểm</h3>
        </div>
        <div className="settings-card-body">
          <div className="danger-item">
            <div>
              <h4>Xóa tài khoản</h4>
              <p>Một khi đã xóa, tài khoản không thể khôi phục. Tất cả dữ liệu sẽ bị xóa vĩnh viễn.</p>
            </div>
            <button className="btn-danger-settings" disabled title="Tính năng sẽ sớm ra mắt">
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════
     SECTION: Sessions
     ═══════════════════════════════════════════════ */
  const renderSessions = () => (
    <div className="settings-section" id="settings-sessions">
      <div className="settings-section-header">
        <FiMonitor className="section-icon" />
        <div>
          <h2>Phiên đăng nhập</h2>
          <p>Quản lý các phiên đăng nhập của bạn</p>
        </div>
      </div>
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Phiên hiện tại</h3>
        </div>
        <div className="settings-card-body">
          <div className="session-current">
            <div className="session-device">
              <FiMonitor size={20} />
              <div className="session-info">
                <h4>Thiết bị hiện tại</h4>
                <p>{navigator.userAgent.includes('Windows') ? 'Windows' : navigator.userAgent.includes('Mac') ? 'macOS' : 'Unknown OS'} • {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Browser'}</p>
                <span className="session-active">● Đang hoạt động</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="settings-card">
        <div className="settings-card-header">
          <h3>Bảo mật phiên</h3>
        </div>
        <div className="settings-card-body">
          <div className="danger-item">
            <div>
              <h4>Đăng xuất tất cả thiết bị</h4>
              <p>Đăng xuất khỏi tất cả các phiên trên các thiết bị khác. Phiên hiện tại sẽ được giữ lại.</p>
            </div>
            <button className="btn-outline-settings" disabled title="Tính năng sẽ sớm ra mắt">
              <FiLogOut size={14} />
              Đăng xuất tất cả
            </button>
          </div>
          <p className="coming-soon-note">🚧 Tính năng quản lý phiên sẽ sớm ra mắt</p>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  const renderContent = () => {
    switch (activeSection) {
      case 'appearance': return renderAppearance();
      case 'editor': return renderEditor();
      case 'sound': return renderSound();
      case 'privacy': return renderPrivacy();
      case 'localization': return renderLocalization();
      case 'notifications': return renderNotifications();
      case 'account': return renderAccount();
      case 'sessions': return renderSessions();
      default: return renderAppearance();
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-page-header">
        <div className="settings-page-header-inner">
          <button type="button" className="settings-back-btn" onClick={() => navigate('/rooms')}>
            <FiArrowLeft size={16} />
            <span>Quay lại</span>
          </button>
          <h1>Cài đặt</h1>
        </div>
      </header>

      <button className="settings-mobile-toggle" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
        {SECTIONS.find(s => s.id === activeSection)?.label}
        <FiChevronRight size={14} className={mobileSidebarOpen ? 'rotated' : ''} />
      </button>

      <div className="settings-body">
        <nav className={`settings-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
          <div className="settings-sidebar-inner">
            {SECTIONS.map((section) => {
              const SectionIcon = section.icon;
              return (
                <button
                  key={section.id}
                  className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => handleSectionChange(section.id)}
                  id={`settings-nav-${section.id}`}
                >
                  <SectionIcon size={16} />
                  <span>{section.label}</span>
                  {activeSection === section.id && <div className="nav-active-indicator" />}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="settings-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Settings;

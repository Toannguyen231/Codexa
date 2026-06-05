import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiUsers, FiCpu, FiCode, FiLayers, 
  FiSearch, FiEdit2, FiTrash2, FiPlus, FiGlobe, 
  FiPlay, FiCheck, FiX, FiRefreshCw, FiAlertCircle, FiShield
} from 'react-icons/fi';
import './AdminDashboard.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; }
    catch { return {}; }
  })();

  // Security Check: Redirect if not admin
  useEffect(() => {
    if (!token || currentUser.role !== 'admin') {
      navigate('/rooms');
    }
  }, [token, currentUser, navigate]);

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users management state
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit] = useState(10);
  const [usersPages, setUsersPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRole, setUsersRole] = useState('All');
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editPoints, setEditPoints] = useState(0);
  const [editRole, setEditRole] = useState('user');
  const [userActionLoading, setUserActionLoading] = useState(false);

  // Problems management state
  const [problems, setProblems] = useState([]);
  const [problemsTotal, setProblemsTotal] = useState(0);
  const [problemsPage, setProblemsPage] = useState(1);
  const [problemsLimit] = useState(15);
  const [problemsPages, setProblemsPages] = useState(1);
  const [problemsSearch, setProblemsSearch] = useState('');
  const [problemsDifficulty, setProblemsDifficulty] = useState('All');
  const [problemsLoading, setProblemsLoading] = useState(false);
  
  // Modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importContestId, setImportContestId] = useState('');
  const [importIndex, setImportIndex] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');

  const [showTestcaseModal, setShowTestcaseModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [testcases, setTestcases] = useState([]);
  const [testcaseLoading, setTestcaseLoading] = useState(false);
  const [testcaseMessage, setTestcaseMessage] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Rooms management state
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsSearch, setRoomsSearch] = useState('');

  // Alerts
  const [successAlert, setSuccessAlert] = useState('');
  const [errorAlert, setErrorAlert] = useState('');

  // API Request Helper
  const apiCall = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };
    const res = await fetch(`${API_URL}${url}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `API Error: ${res.status}`);
    return data;
  }, [token]);

  // Alert dismisser
  useEffect(() => {
    if (successAlert) {
      const timer = setTimeout(() => setSuccessAlert(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successAlert]);

  useEffect(() => {
    if (errorAlert) {
      const timer = setTimeout(() => setErrorAlert(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorAlert]);

  // ── 1. Fetch Overview Stats ──
  const fetchOverviewStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await apiCall('/admin/stats');
      setStats(data.stats);
    } catch (err) {
      setErrorAlert('Không thể tải thống kê: ' + err.message);
    } finally {
      setStatsLoading(false);
    }
  }, [apiCall]);

  // ── 2. Fetch Users ──
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const query = new URLSearchParams({
        search: usersSearch,
        role: usersRole,
        page: usersPage,
        limit: usersLimit
      });
      const data = await apiCall(`/admin/users?${query.toString()}`);
      setUsers(data.users || []);
      setUsersTotal(data.total || 0);
      setUsersPages(data.totalPages || 1);
    } catch (err) {
      setErrorAlert('Không thể tải danh sách người dùng: ' + err.message);
    } finally {
      setUsersLoading(false);
    }
  }, [apiCall, usersSearch, usersRole, usersPage, usersLimit]);

  // ── 3. Fetch Problems ──
  const fetchProblems = useCallback(async () => {
    setProblemsLoading(true);
    try {
      const query = new URLSearchParams({
        search: problemsSearch,
        difficulty: problemsDifficulty,
        page: problemsPage,
        limit: problemsLimit
      });
      const data = await apiCall(`/admin/problems?${query.toString()}`);
      setProblems(data.items || []);
      setProblemsTotal(data.total || 0);
      setProblemsPages(data.totalPages || 1);
    } catch (err) {
      setErrorAlert('Không thể tải danh sách bài tập: ' + err.message);
    } finally {
      setProblemsLoading(false);
    }
  }, [apiCall, problemsSearch, problemsDifficulty, problemsPage, problemsLimit]);

  // ── 4. Fetch Rooms ──
  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const data = await apiCall('/admin/rooms');
      setRooms(data.rooms || []);
    } catch (err) {
      setErrorAlert('Không thể tải danh sách phòng: ' + err.message);
    } finally {
      setRoomsLoading(false);
    }
  }, [apiCall]);

  // Switch Tab effects
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'problems') {
      fetchProblems();
    } else if (activeTab === 'rooms') {
      fetchRooms();
    }
  }, [activeTab, fetchOverviewStats, fetchUsers, fetchProblems, fetchRooms]);

  // Trigger search with debounce for User & Problem search
  useEffect(() => {
    if (activeTab === 'users') {
      const timer = setTimeout(() => {
        setUsersPage(1);
        fetchUsers();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [usersSearch, usersRole]);

  useEffect(() => {
    if (activeTab === 'problems') {
      const timer = setTimeout(() => {
        setProblemsPage(1);
        fetchProblems();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [problemsSearch, problemsDifficulty]);

  // ── User Edit / Delete ──
  const handleEditUserClick = (u) => {
    setEditingUser(u);
    setEditPoints(u.totalPoints || 0);
    setEditRole(u.role || 'user');
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    setUserActionLoading(true);
    try {
      const data = await apiCall(`/admin/users/${editingUser._id || editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: editRole, totalPoints: editPoints })
      });
      setSuccessAlert(data.message || 'Cập nhật user thành công.');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setErrorAlert(err.message);
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng "${username}" không? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    try {
      const data = await apiCall(`/admin/users/${userId}`, { method: 'DELETE' });
      setSuccessAlert(data.message || 'Xóa người dùng thành công.');
      fetchUsers();
    } catch (err) {
      setErrorAlert('Lỗi khi xóa người dùng: ' + err.message);
    }
  };

  // ── Problem Import ──
  const handleImportProblem = async (e) => {
    e.preventDefault();
    if (!importContestId.trim() || !importIndex.trim()) {
      setImportError('Vui lòng điền Contest ID và Index');
      return;
    }
    setImportLoading(true);
    setImportError('');
    setImportMessage('');
    try {
      const data = await apiCall('/admin/problems/import', {
        method: 'POST',
        body: JSON.stringify({
          contestId: importContestId.trim(),
          index: importIndex.trim().toUpperCase()
        })
      });
      setImportMessage(data.message || 'Đã import thành công!');
      setImportContestId('');
      setImportIndex('');
      fetchProblems();
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // ── Testcase View / Edit ──
  const handleManageTestcases = async (prob) => {
    setSelectedProblem(prob);
    setTestcaseLoading(true);
    setTestcases([]);
    setShowTestcaseModal(true);
    setTestcaseMessage('');
    try {
      const data = await apiCall(`/admin/problems/${prob.contestId}/${prob.index}/testcases`);
      setTestcases(data.testcases || []);
    } catch (err) {
      setTestcaseMessage('Lỗi tải testcases: ' + err.message);
    } finally {
      setTestcaseLoading(false);
    }
  };

  const handleAddTestcase = () => {
    setTestcases([...testcases, { input: '', output: '', isHidden: true }]);
  };

  const handleTestcaseFieldChange = (idx, field, value) => {
    const updated = [...testcases];
    updated[idx][field] = value;
    setTestcases(updated);
  };

  const handleRemoveTestcase = (idx) => {
    setTestcases(testcases.filter((_, i) => i !== idx));
  };

  const handleSaveTestcases = async () => {
    setTestcaseLoading(true);
    setTestcaseMessage('');
    try {
      const data = await apiCall(`/admin/problems/${selectedProblem.contestId}/${selectedProblem.index}/testcases`, {
        method: 'PUT',
        body: JSON.stringify({ testcases })
      });
      setSuccessAlert('Lưu testcases thành công!');
      setShowTestcaseModal(false);
      fetchProblems();
    } catch (err) {
      setTestcaseMessage('Lỗi lưu testcases: ' + err.message);
    } finally {
      setTestcaseLoading(false);
    }
  };

  const handleGenerateAiTestcases = async () => {
    if (!window.confirm('Hệ thống sẽ dùng Gemini AI để quét đề bài và tạo lại bộ test case ẩn. Thao tác này sẽ ghi đè bộ testcase cũ. Bạn muốn tiếp tục?')) {
      return;
    }
    setAiGenerating(true);
    setTestcaseLoading(true);
    setTestcaseMessage('');
    try {
      const data = await apiCall(`/admin/problems/${selectedProblem.contestId}/${selectedProblem.index}/testcases/generate`, {
        method: 'POST'
      });
      setTestcases(data.testcases || []);
      setSuccessAlert(data.message || 'AI sinh testcases thành công!');
    } catch (err) {
      setTestcaseMessage('Lỗi AI sinh testcases: ' + err.message);
    } finally {
      setAiGenerating(false);
      setTestcaseLoading(false);
    }
  };

  // ── Force Close Room ──
  const handleForceCloseRoom = async (roomId, roomName) => {
    if (!window.confirm(`Bạn có chắc muốn BUỘC ĐÓNG và XÓA phòng "${roomName}" (${roomId}) không?`)) {
      return;
    }
    try {
      const data = await apiCall(`/admin/rooms/${roomId}`, { method: 'DELETE' });
      setSuccessAlert(data.message || 'Xóa phòng thành công.');
      fetchRooms();
    } catch (err) {
      setErrorAlert('Lỗi xóa phòng: ' + err.message);
    }
  };

  // SVG Rank Distribution helper
  const renderRankChart = () => {
    if (!stats || !stats.rankDistribution) return null;
    
    const distribution = stats.rankDistribution;
    const maxVal = Math.max(...Object.values(distribution), 1);
    
    return (
      <div className="rank-chart-container">
        {Object.entries(distribution).map(([rankName, count]) => {
          const percent = (count / stats.totalUsers) * 100 || 0;
          return (
            <div key={rankName} className="rank-chart-bar-row">
              <span className="rank-name-lbl">{rankName}</span>
              <div className="rank-bar-bg">
                <div 
                  className="rank-bar-fill" 
                  style={{ 
                    width: `${percent}%`,
                    backgroundColor: ['#A0AEC0', '#B45309', '#BFDBFE', '#FCD34D', '#A78BFA', '#06B6D4', '#FF6B6B'][
                      ['Sắt', 'Đồng', 'Bạc', 'Vàng', 'Tinh Anh', 'Kim Cương', 'Thách Đấu'].indexOf(rankName)
                    ]
                  }}
                />
              </div>
              <span className="rank-count-lbl">{count} ({percent.toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="admin-dashboard-wrapper">
      {/* Alerts */}
      {successAlert && (
        <div className="admin-alert alert-success">
          <FiCheck size={16} /> <span>{successAlert}</span>
        </div>
      )}
      {errorAlert && (
        <div className="admin-alert alert-error">
          <FiAlertCircle size={16} /> <span>{errorAlert}</span>
        </div>
      )}

      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <button className="back-btn" onClick={() => navigate('/rooms')}>
            <FiArrowLeft size={16} /> Về Trang Chủ
          </button>
          <div className="admin-brand">
            <FiShield size={20} className="admin-shield-icon" />
            <h1>Quản Trị Hệ Thống</h1>
            <span className="admin-badge">ADMIN</span>
          </div>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-tag">
            <span>Chào, {currentUser.username}</span>
          </div>
        </div>
      </header>

      {/* Workspace Sidebar & Content */}
      <div className="admin-workspace">
        <aside className="admin-sidebar">
          <button 
            className={`sidebar-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FiLayers size={16} /> Tổng Quan Hệ Thống
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers size={16} /> Quản Lý Người Dùng
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveTab('problems')}
          >
            <FiCode size={16} /> Quản Lý Bài Tập
          </button>
          <button 
            className={`sidebar-nav-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            <FiGlobe size={16} /> Giám Sát Phòng Code
          </button>
        </aside>

        <main className="admin-content-area">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <h2>Tổng quan chỉ số</h2>
              {statsLoading ? (
                <div className="loading-spinner-wrap"><div className="spinner" /></div>
              ) : (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-card-icon user-icon"><FiUsers size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Người Dùng</h3>
                        <span className="stat-number">{stats?.totalUsers || 0}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon room-icon"><FiGlobe size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Tổng Số Phòng</h3>
                        <span className="stat-number">{stats?.totalRooms || 0}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon active-room-icon"><FiPlay size={24} style={{ color: '#10b981' }} /></div>
                      <div className="stat-card-details">
                        <h3>Phòng Đang Chạy</h3>
                        <span className="stat-number">{stats?.activeRoomsCount || 0}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon problem-icon"><FiCode size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Đề Bài Cache</h3>
                        <span className="stat-number">{stats?.totalProblems || 0}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon testcase-icon"><FiCpu size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Bộ Testcases Cache</h3>
                        <span className="stat-number">{stats?.totalTestCases || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="charts-section">
                    <div className="chart-card">
                      <h3>Tỉ Lệ Phân Bố Rank Người Chơi</h3>
                      {renderRankChart()}
                    </div>
                    <div className="info-card">
                      <h3>Hệ Thống & Cấu Hình</h3>
                      <div className="info-list">
                        <div className="info-row">
                          <span>Phiên bản Node.js:</span>
                          <strong>v20.x / v22.x Compatible</strong>
                        </div>
                        <div className="info-row">
                          <span>Môi Trường:</span>
                          <strong>Development / Sandbox</strong>
                        </div>
                        <div className="info-row">
                          <span>AI Engine:</span>
                          <strong>Google Gemini (gemini-2.0-flash)</strong>
                        </div>
                        <div className="info-row">
                          <span>Trình Biên Dịch:</span>
                          <strong>Wandbox API Proxy</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>Danh sách người dùng</h2>
                <div className="pane-actions">
                  <div className="search-wrap">
                    <FiSearch size={14} />
                    <input 
                      type="text" 
                      placeholder="Tìm theo username hoặc email..." 
                      value={usersSearch}
                      onChange={(e) => setUsersSearch(e.target.value)}
                    />
                  </div>
                  <select 
                    value={usersRole} 
                    onChange={(e) => setUsersRole(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">Tất cả vai trò</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {usersLoading ? (
                <div className="loading-spinner-wrap"><div className="spinner" /></div>
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Người dùng</th>
                          <th>Email</th>
                          <th>Vai trò</th>
                          <th>Hạng</th>
                          <th>Điểm</th>
                          <th>Ngày tạo</th>
                          <th style={{ textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không có người dùng phù hợp</td></tr>
                        ) : users.map(u => (
                          <tr key={u.id || u._id}>
                            <td>
                              <div className="user-profile-td">
                                <span className="avatar-placeholder">{u.username ? u.username.slice(0, 2).toUpperCase() : '??'}</span>
                                <strong style={{ color: u.role === 'admin' ? '#c084fc' : '' }}>{u.username}</strong>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`role-pill ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                {u.role === 'admin' ? 'Admin' : 'User'}
                              </span>
                            </td>
                            <td>
                              <span className="rank-badge" style={{ 
                                backgroundColor: ['#A0AEC0', '#B45309', '#BFDBFE', '#FCD34D', '#A78BFA', '#06B6D4', '#FF6B6B'][
                                  ['Sắt', 'Đồng', 'Bạc', 'Vàng', 'Tinh Anh', 'Kim Cương', 'Thách Đấu'].indexOf(u.rank)
                                ] || '#fff'
                              }}>
                                {u.rank || 'Sắt'}
                              </span>
                            </td>
                            <td>{(u.totalPoints || 0).toLocaleString()} pts</td>
                            <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                            <td>
                              <div className="actions-cell">
                                <button className="edit-btn" onClick={() => handleEditUserClick(u)} title="Sửa điểm/vai trò">
                                  <FiEdit2 size={13} /> Sửa
                                </button>
                                {currentUser.id !== (u.id || u._id) && (
                                  <button className="delete-btn" onClick={() => handleDeleteUser(u.id || u._id, u.username)} title="Xóa tài khoản">
                                    <FiTrash2 size={13} /> Xóa
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="table-pagination">
                    <button disabled={usersPage <= 1} onClick={() => setUsersPage(usersPage - 1)}>Trước</button>
                    <span>Trang {usersPage} / {usersPages} ({usersTotal} users)</span>
                    <button disabled={usersPage >= usersPages} onClick={() => setUsersPage(usersPage + 1)}>Sau</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: PROBLEMS MANAGEMENT */}
          {activeTab === 'problems' && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>Quản lý đề bài Codeforces</h2>
                <div className="pane-actions">
                  <button className="import-btn" onClick={() => { setShowImportModal(true); setImportError(''); setImportMessage(''); }}>
                    <FiPlus size={14} /> Import Đề Từ CF
                  </button>
                  <div className="search-wrap">
                    <FiSearch size={14} />
                    <input 
                      type="text" 
                      placeholder="Tìm bài tập theo tên..." 
                      value={problemsSearch}
                      onChange={(e) => setProblemsSearch(e.target.value)}
                    />
                  </div>
                  <select 
                    value={problemsDifficulty} 
                    onChange={(e) => setProblemsDifficulty(e.target.value)}
                    className="filter-select"
                  >
                    <option value="All">Tất cả độ khó</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              {problemsLoading ? (
                <div className="loading-spinner-wrap"><div className="spinner" /></div>
              ) : (
                <>
                  <div className="table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Contest-Index</th>
                          <th>Tên bài tập</th>
                          <th>Độ khó</th>
                          <th>Thẻ (Tags)</th>
                          <th style={{ textAlign: 'center' }}>Bộ Testcases</th>
                          <th style={{ textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {problems.length === 0 ? (
                          <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Không tìm thấy bài tập nào</td></tr>
                        ) : problems.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.contestId}-{p.index}</strong></td>
                            <td>{p.name}</td>
                            <td>
                              <span className={`diff-badge diff-${p.difficulty.toLowerCase()}`}>
                                {p.difficulty}
                              </span>
                            </td>
                            <td>
                              <div className="problem-tags-td">
                                {p.tags.slice(0, 3).map(t => <span key={t} className="p-tag">{t}</span>)}
                                {p.tags.length > 3 && <span className="p-tag-more">+{p.tags.length - 3}</span>}
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`status-dot ${p.hasTestCases ? 'has-tests' : 'no-tests'}`} />
                              <span>{p.hasTestCases ? 'Đã có bộ tests' : 'Chưa có tests'}</span>
                            </td>
                            <td>
                              <div className="actions-cell">
                                <button className="edit-btn" onClick={() => handleManageTestcases(p)}>
                                  <FiEdit2 size={13} /> Sửa Testcases
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="table-pagination">
                    <button disabled={problemsPage <= 1} onClick={() => setProblemsPage(problemsPage - 1)}>Trước</button>
                    <span>Trang {problemsPage} / {problemsPages} ({problemsTotal} đề bài)</span>
                    <button disabled={problemsPage >= problemsPages} onClick={() => setProblemsPage(problemsPage + 1)}>Sau</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: ROOM MONITOR */}
          {activeTab === 'rooms' && (
            <div className="tab-pane">
              <div className="pane-header">
                <h2>Giám sát phòng code</h2>
                <div className="pane-actions">
                  <div className="search-wrap">
                    <FiSearch size={14} />
                    <input 
                      type="text" 
                      placeholder="Lọc phòng theo tên hoặc Room ID..." 
                      value={roomsSearch}
                      onChange={(e) => setRoomsSearch(e.target.value)}
                    />
                  </div>
                  <button className="refresh-btn" onClick={fetchRooms} title="Cập nhật danh sách">
                    <FiRefreshCw size={14} /> Refresh
                  </button>
                </div>
              </div>

              {roomsLoading ? (
                <div className="loading-spinner-wrap"><div className="spinner" /></div>
              ) : (
                <div className="table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Room ID</th>
                        <th>Tên phòng</th>
                        <th>Ngôn ngữ</th>
                        <th>Người tạo</th>
                        <th>Trạng thái</th>
                        <th>User Live</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms
                        .filter(r => 
                          r.roomId.toLowerCase().includes(roomsSearch.toLowerCase()) || 
                          r.name.toLowerCase().includes(roomsSearch.toLowerCase())
                        )
                        .map(r => (
                          <tr key={r.id}>
                            <td><code>{r.roomId}</code></td>
                            <td>
                              <strong style={{ color: r.isPrivate ? '#f59e0b' : '' }}>{r.name}</strong>
                              {r.isPrivate && <span style={{ fontSize: '10px', marginLeft: '6px', color: '#f59e0b' }}>🔒 Private</span>}
                            </td>
                            <td>{r.language}</td>
                            <td>
                              <div>
                                <div><strong>{r.creator?.username || 'System'}</strong></div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.creator?.email || ''}</div>
                              </div>
                            </td>
                            <td>
                              <span className={`status-pill ${r.isActive ? 'active' : 'inactive'}`}>
                                {r.isActive ? 'Đang hoạt động' : 'Offline'}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: r.onlineCount > 0 ? '#10b981' : '' }}>
                                {r.onlineCount} người
                              </strong>
                            </td>
                            <td>
                              <button className="delete-btn" onClick={() => handleForceCloseRoom(r.roomId, r.name)}>
                                <FiX size={13} /> Force Close
                              </button>
                            </td>
                          </tr>
                        ))}
                      {rooms.length === 0 && (
                        <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có phòng code nào hoạt động trong hệ thống</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: EDIT USER DIALOG */}
      {editingUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Chỉnh sửa người dùng: {editingUser.username}</h3>
              <button className="close-btn" onClick={() => setEditingUser(null)}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleSaveUserEdit}>
              <div className="admin-modal-body">
                <div className="form-group">
                  <label>Email</label>
                  <input type="text" value={editingUser.email} disabled />
                </div>
                <div className="form-group">
                  <label>Vai trò</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tổng điểm tích lũy (totalPoints)</label>
                  <input 
                    type="number" 
                    value={editPoints} 
                    onChange={(e) => setEditPoints(Number(e.target.value))}
                    min="0"
                  />
                  <small style={{ color: 'var(--text-muted)' }}>Hệ thống sẽ tự động cập nhật phân hạng tương ứng sau khi lưu.</small>
                </div>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setEditingUser(null)}>Hủy</button>
                <button type="submit" className="save-btn" disabled={userActionLoading}>
                  {userActionLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: IMPORT CF PROBLEM DIALOG */}
      {showImportModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>Import Đề Bài Từ Codeforces</h3>
              <button className="close-btn" onClick={() => setShowImportModal(false)}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleImportProblem}>
              <div className="admin-modal-body">
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                  Nhập thông tin đề bài từ Codeforces. Hệ thống sẽ cào đề bài, tải tài nguyên, và tự động dùng AI để tạo bộ test case ẩn nếu bài tập chưa tồn tại trong cache.
                </p>
                {importError && <div className="modal-alert error">{importError}</div>}
                {importMessage && <div className="modal-alert success">{importMessage}</div>}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Contest ID</label>
                    <input 
                      type="number" 
                      placeholder="VD: 4" 
                      value={importContestId}
                      onChange={(e) => setImportContestId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Index (Ký tự chỉ mục)</label>
                    <input 
                      type="text" 
                      placeholder="VD: A" 
                      value={importIndex}
                      onChange={(e) => setImportIndex(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowImportModal(false)}>Đóng</button>
                <button type="submit" className="save-btn" disabled={importLoading}>
                  {importLoading ? 'Đang cào dữ liệu...' : 'Import Đề'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGE TESTCASES DIALOG */}
      {showTestcaseModal && selectedProblem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal testcase-modal">
            <div className="admin-modal-header">
              <h3>Quản lý Testcases: {selectedProblem.contestId}-{selectedProblem.index} ({selectedProblem.name})</h3>
              <button className="close-btn" onClick={() => setShowTestcaseModal(false)}><FiX size={16} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="testcase-modal-top">
                <span className="p-badge font-bold">CF-{selectedProblem.contestId}-{selectedProblem.index}</span>
                <div className="modal-actions-bar">
                  <button 
                    className="ai-btn"
                    onClick={handleGenerateAiTestcases}
                    disabled={aiGenerating || testcaseLoading}
                  >
                    <FiCpu size={14} /> {aiGenerating ? 'AI Đang Sinh...' : 'Sinh Testcase ẩn bằng Gemini AI'}
                  </button>
                  <button className="add-testcase-btn" onClick={handleAddTestcase}>
                    <FiPlus size={14} /> Thêm Testcase Thủ Công
                  </button>
                </div>
              </div>

              {testcaseMessage && <div className="modal-alert info">{testcaseMessage}</div>}

              {testcaseLoading && !aiGenerating ? (
                <div className="loading-spinner-wrap"><div className="spinner" /></div>
              ) : (
                <div className="testcase-list">
                  {testcases.length === 0 ? (
                    <div className="no-testcases">Chưa có testcase nào cho bài này. Hãy nhập thủ công hoặc click "Sinh Testcase bằng AI"</div>
                  ) : (
                    testcases.map((tc, idx) => (
                      <div key={idx} className="testcase-row-card">
                        <div className="testcase-row-header">
                          <strong>Testcase #{idx + 1}</strong>
                          <div className="tc-header-right">
                            <label className="tc-hidden-toggle">
                              <input 
                                type="checkbox" 
                                checked={tc.isHidden}
                                onChange={(e) => handleTestcaseFieldChange(idx, 'isHidden', e.target.checked)}
                              />
                              <span>Test ẩn</span>
                            </label>
                            <button className="tc-del-btn" onClick={() => handleRemoveTestcase(idx)}>
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="testcase-row-io">
                          <div className="io-box">
                            <label>Đầu vào (Input)</label>
                            <textarea 
                              value={tc.input} 
                              onChange={(e) => handleTestcaseFieldChange(idx, 'input', e.target.value)}
                              placeholder="Nhập input của testcase..."
                            />
                          </div>
                          <div className="io-box">
                            <label>Đầu ra (Output)</label>
                            <textarea 
                              value={tc.output} 
                              onChange={(e) => handleTestcaseFieldChange(idx, 'output', e.target.value)}
                              placeholder="Nhập output tương ứng..."
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowTestcaseModal(false)}>Hủy</button>
              <button type="button" className="save-btn" onClick={handleSaveTestcases} disabled={testcaseLoading}>
                {testcaseLoading ? 'Đang lưu...' : 'Lưu Bộ Testcase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiUsers, FiCpu, FiCode, FiSearch,
  FiEdit2, FiTrash2, FiPlus, FiGlobe, FiPlay, FiCheck,
  FiX, FiRefreshCw, FiAlertCircle, FiShield, FiUserPlus,
  FiActivity, FiServer, FiZap, FiBarChart2, FiDatabase
} from 'react-icons/fi';
import { getRankImage } from '../../utils/rankImages';
import API from '../../api';
import './AdminDashboard.scss';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; }
    catch { return {}; }
  });

  // Sync user khi có thay đổi
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

  // Activity log (simulated)
  const [activities, setActivities] = useState([]);

  // Alerts
  const [successAlert, setSuccessAlert] = useState('');
  const [errorAlert, setErrorAlert] = useState('');

  // API Request Helper via centralized API client (handles auto-refresh & token errors)
  const apiCall = useCallback(async (url, options = {}) => {
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const method = (options.method || 'GET').toLowerCase();
    let body = options.body;
    if (body && typeof body === 'string') {
      try { body = JSON.parse(body); } catch { /* keep as is */ }
    }

    const { data } = await API[method](cleanUrl, {
      body,
      headers: options.headers,
    });
    return data;
  }, []);

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
      // Generate mock activity from stats
      const mockActivities = [
        { id: 1, type: 'user', text: <><strong>{data.stats?.recentUsers?.[0]?.username || 'Người dùng mới'}</strong> đã đăng ký tài khoản</>, time: '2 phút trước' },
        { id: 2, type: 'room', text: <>Phòng <strong>Code Battle #142</strong> đã được tạo</>, time: '15 phút trước' },
        { id: 3, type: 'problem', text: <>Đề <strong>CF-4A</strong> đã được import vào hệ thống</>, time: '1 giờ trước' },
        { id: 4, type: 'testcase', text: <>Testcases cho đề <strong>CF-1234C</strong> đã được cập nhật</>, time: '3 giờ trước' },
        { id: 5, type: 'system', text: <>Hệ thống đã hoàn thành <strong>47 lượt chạy code</strong> trong 24h qua</>, time: '6 giờ trước' },
      ];
      setActivities(mockActivities);
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

  // Refs luôn trỏ tới fetch mới nhất (tránh stale closure trong debounce effect
  // mà KHÔNG cần đưa fetchUsers/fetchProblems vào deps — nếu đưa vào, effect sẽ
  // chạy lại vô hạn vì chúng thay đổi theo usersPage/problemsPage khi setPage(1)).
  // Sync qua useEffect vì react-hooks/refs cấm gán ref.current trong render.
  const fetchUsersRef = useRef(fetchUsers);
  const fetchProblemsRef = useRef(fetchProblems);
  useEffect(() => { fetchUsersRef.current = fetchUsers; }, [fetchUsers]);
  useEffect(() => { fetchProblemsRef.current = fetchProblems; }, [fetchProblems]);

  // Switch Tab & Pagination effects
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverviewStats();
    } else if (activeTab === 'rooms') {
      fetchRooms();
    }
  }, [activeTab, fetchOverviewStats, fetchRooms]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsersRef.current();
    }
  }, [activeTab, usersPage]);

  useEffect(() => {
    if (activeTab === 'problems') {
      fetchProblemsRef.current();
    }
  }, [activeTab, problemsPage]);

  // Trigger search with debounce for User & Problem search
  // activeTab trong deps để khi rời tab, timer được clear đúng cách.
  useEffect(() => {
    if (activeTab !== 'users') return;
    const timer = setTimeout(() => {
      setUsersPage((prevPage) => {
        if (prevPage === 1) {
          fetchUsersRef.current();
          return 1;
        }
        return 1;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [usersSearch, usersRole, activeTab]);

  useEffect(() => {
    if (activeTab !== 'problems') return;
    const timer = setTimeout(() => {
      setProblemsPage((prevPage) => {
        if (prevPage === 1) {
          fetchProblemsRef.current();
          return 1;
        }
        return 1;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [problemsSearch, problemsDifficulty, activeTab]);

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
      await apiCall(`/admin/problems/${selectedProblem.contestId}/${selectedProblem.index}/testcases`, {
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
    if (!window.confirm('Hệ thống sẽ dùng AI (DeepSeek) sinh reference solution C++ → chạy qua Judge0 để verify output thật.\n\nThao tác này sẽ ghi đè bộ test case ẩn cũ.\nBạn muốn tiếp tục?')) {
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
      setSuccessAlert(data.message || 'Sinh + verify testcases thành công!');
    } catch (err) {
      setTestcaseMessage('Lỗi sinh testcases: ' + err.message);
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
    const rankColors = {
      'Sắt': '#A0AEC0',
      'Đồng': '#B45309',
      'Bạc': '#BFDBFE',
      'Vàng': '#FCD34D',
      'Tinh Anh': '#A78BFA',
      'Kim Cương': '#06B6D4',
      'Thách Đấu': '#FF6B6B'
    };

    return (
      <div className="rank-chart-container">
        {Object.entries(distribution).map(([rankName, count]) => {
          const percent = (count / stats.totalUsers) * 100 || 0;
          const color = rankColors[rankName] || '#A0AEC0';
          return (
            <div key={rankName} className="rank-chart-bar-row">
              <span className="rank-name-lbl">
                <img src={getRankImage(rankName)} alt={rankName} className="rank-bar-icon" />
                {rankName}
              </span>
              <div className="rank-bar-bg">
                <div
                  className="rank-bar-fill"
                  style={{ width: `${Math.max(percent, 1)}%`, backgroundColor: color }}
                />
              </div>
              <span className="rank-count-lbl">{count} ({percent.toFixed(1)}%)</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Activity icon helper
  const getActivityIcon = (type) => {
    const icons = {
      user: { icon: <FiUserPlus size={14} />, cls: 'green' },
      room: { icon: <FiGlobe size={14} />, cls: 'blue' },
      problem: { icon: <FiCode size={14} />, cls: 'purple' },
      testcase: { icon: <FiDatabase size={14} />, cls: 'yellow' },
      system: { icon: <FiServer size={14} />, cls: 'red' },
    };
    return icons[type] || { icon: <FiActivity size={14} />, cls: 'blue' };
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
            <FiArrowLeft size={16} /> <span>Về Trang Chủ</span>
          </button>
          <div className="admin-brand">
            <FiShield size={20} className="admin-shield-icon" />
            <h1>Quản Trị Hệ Thống</h1>
            <span className="admin-badge">ADMIN</span>
          </div>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-tag">
            <span className="admin-online-dot" />
            <span className="admin-user-avatar">
              {currentUser.username ? currentUser.username.slice(0, 2).toUpperCase() : 'AD'}
            </span>
            <span>Xin chào, {currentUser.username || 'Admin'}</span>
          </div>
        </div>
      </header>

      {/* Workspace Sidebar & Content */}
      <div className="admin-workspace">
        <aside className="admin-sidebar">
          <div className="sidebar-section-label">Điều Hướng</div>
          <button
            className={`sidebar-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FiBarChart2 size={16} /> Tổng Quan
          </button>
          <button
            className={`sidebar-nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers size={16} /> Người Dùng
          </button>
          <button
            className={`sidebar-nav-btn ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveTab('problems')}
          >
            <FiCode size={16} /> Bài Tập
          </button>
          <button
            className={`sidebar-nav-btn ${activeTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            <FiGlobe size={16} /> Phòng Code
          </button>
        </aside>

        <main className="admin-content-area">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <div className="tab-header">
                <h2>Tổng Quan Hệ Thống</h2>
                <p className="tab-subtitle">Theo dõi toàn bộ hoạt động và chỉ số của hệ thống Codexa</p>
              </div>
              {statsLoading ? (
                <div className="loading-spinner-wrap">
                  <div className="spinner" />
                  <span>Đang tải dữ liệu thống kê...</span>
                </div>
              ) : (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-card-icon icon-users"><FiUsers size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Người Dùng</h3>
                        <span className="stat-number">{stats?.totalUsers || 0}</span>
                        <span className="stat-change up">+{stats?.newUsersToday || 0} hôm nay</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon icon-rooms"><FiGlobe size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Tổng Phòng</h3>
                        <span className="stat-number">{stats?.totalRooms || 0}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon icon-active"><FiPlay size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Đang Hoạt Động</h3>
                        <span className="stat-number">{stats?.activeRoomsCount || 0}</span>
                        <span className="stat-change up">phòng code live</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon icon-problems"><FiCode size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Đề Bài</h3>
                        <span className="stat-number">{stats?.totalProblems || 0}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon icon-testcases"><FiCpu size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Testcase</h3>
                        <span className="stat-number">{stats?.totalTestCases || 0}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card-icon icon-submissions"><FiZap size={24} /></div>
                      <div className="stat-card-details">
                        <h3>Lượt Chạy Code</h3>
                        <span className="stat-number">{stats?.totalSubmissions || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="charts-section">
                    <div className="chart-card">
                      <h3>
                        <FiBarChart2 size={16} className="card-icon" />
                        Phân Bố Rank Người Chơi
                      </h3>
                      {renderRankChart()}
                    </div>
                    <div className="info-card">
                      <h3>
                        <FiServer size={16} className="card-icon" />
                        Cấu Hình Hệ Thống
                      </h3>
                      <div className="info-list">
                        <div className="info-row">
                          <span className="info-label"><span className="info-dot dot-purple" /> Node.js</span>
                          <strong>v20.x / v22.x</strong>
                        </div>
                        <div className="info-row">
                          <span className="info-label"><span className="info-dot dot-green" /> Môi Trường</span>
                          <strong>Development</strong>
                        </div>
                        <div className="info-row">
                          <span className="info-label"><span className="info-dot dot-blue" /> AI Engine</span>
                          <strong>Gemini 2.0 Flash</strong>
                        </div>
                        <div className="info-row">
                          <span className="info-label"><span className="info-dot dot-yellow" /> Compiler</span>
                          <strong>Wandbox Proxy</strong>
                        </div>
                        <div className="info-row">
                          <span className="info-label"><span className="info-dot dot-purple" /> Database</span>
                          <strong>MongoDB</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="activity-section">
                    <div className="activity-header">
                      <h3>
                        <FiActivity size={16} />
                        Hoạt Động Gần Đây
                      </h3>
                      <span className="activity-badge">Live</span>
                    </div>
                    <div className="activity-list">
                      {activities.map((act) => {
                        const actIcon = getActivityIcon(act.type);
                        return (
                          <div key={act.id} className="activity-item">
                            <div className={`activity-icon-wrap ${actIcon.cls}`}>
                              {actIcon.icon}
                            </div>
                            <div className="activity-content">
                              <p className="activity-text">{act.text}</p>
                              <span className="activity-time">{act.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="tab-pane">
              <div className="tab-header">
                <h2>Quản Lý Người Dùng</h2>
                <p className="tab-subtitle">Quản lý tài khoản, phân quyền và điểm số người dùng</p>
              </div>
              <div className="pane-header">
                <div className="pane-actions">
                  <div className="search-wrap">
                    <FiSearch size={14} />
                    <input
                      type="text"
                      placeholder="Tìm username hoặc email..."
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
                <div className="loading-spinner-wrap">
                  <div className="spinner" />
                  <span>Đang tải danh sách người dùng...</span>
                </div>
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
                          <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Không có người dùng phù hợp</td></tr>
                        ) : users.map(u => (
                          <tr key={u.id || u._id}>
                            <td>
                              <div className="user-profile-td">
                                <span className="avatar-placeholder">{u.username ? u.username.slice(0, 2).toUpperCase() : '??'}</span>
                                <div className="user-name-wrap">
                                  <span className="user-name">{u.username}</span>
                                </div>
                              </div>
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`role-pill ${u.role === 'admin' ? 'role-admin' : 'role-user'}`}>
                                {u.role === 'admin' ? 'Admin' : 'User'}
                              </span>
                            </td>
                            <td>
                              <span className="rank-badge-image">
                                <img
                                  src={getRankImage(u.rank || 'Sắt')}
                                  alt={u.rank || 'Sắt'}
                                  className="rank-badge-img"
                                />
                                <span>{u.rank || 'Sắt'}</span>
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
                    <div className="pagination-info">
                      <span>Trang {usersPage} / {usersPages}</span>
                      <span style={{ color: 'var(--text-dim)' }}>•</span>
                      <span>{usersTotal} người dùng</span>
                    </div>
                    <div className="pagination-btns">
                      <button disabled={usersPage <= 1} onClick={() => setUsersPage(usersPage - 1)}>Trước</button>
                      <button disabled={usersPage >= usersPages} onClick={() => setUsersPage(usersPage + 1)}>Sau</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: PROBLEMS MANAGEMENT */}
          {activeTab === 'problems' && (
            <div className="tab-pane">
              <div className="tab-header">
                <h2>Quản Lý Bài Tập</h2>
                <p className="tab-subtitle">Import đề từ Codeforces, quản lý testcases và độ khó</p>
              </div>
              <div className="pane-header">
                <div className="pane-actions">
                  <button className="import-btn" onClick={() => { setShowImportModal(true); setImportError(''); setImportMessage(''); }}>
                    <FiPlus size={14} /> Import CF
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
                <div className="loading-spinner-wrap">
                  <div className="spinner" />
                  <span>Đang tải danh sách bài tập...</span>
                </div>
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
                          <th style={{ textAlign: 'center' }}>Testcases</th>
                          <th style={{ textAlign: 'center' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {problems.length === 0 ? (
                          <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Không tìm thấy bài tập nào</td></tr>
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
                              <span>{p.hasTestCases ? 'Đã có' : 'Chưa có'}</span>
                            </td>
                            <td>
                              <div className="actions-cell">
                                <button className="edit-btn" onClick={() => handleManageTestcases(p)}>
                                  <FiEdit2 size={13} /> Testcases
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="table-pagination">
                    <div className="pagination-info">
                      <span>Trang {problemsPage} / {problemsPages}</span>
                      <span style={{ color: 'var(--text-dim)' }}>•</span>
                      <span>{problemsTotal} đề bài</span>
                    </div>
                    <div className="pagination-btns">
                      <button disabled={problemsPage <= 1} onClick={() => setProblemsPage(problemsPage - 1)}>Trước</button>
                      <button disabled={problemsPage >= problemsPages} onClick={() => setProblemsPage(problemsPage + 1)}>Sau</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: ROOM MONITOR */}
          {activeTab === 'rooms' && (
            <div className="tab-pane">
              <div className="tab-header">
                <h2>Giám Sát Phòng Code</h2>
                <p className="tab-subtitle">Theo dõi và quản lý các phòng code đang hoạt động</p>
              </div>
              <div className="pane-header">
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
                    <FiRefreshCw size={14} /> Làm mới
                  </button>
                </div>
              </div>

              {roomsLoading ? (
                <div className="loading-spinner-wrap">
                  <div className="spinner" />
                  <span>Đang tải danh sách phòng...</span>
                </div>
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
                            <td><code style={{ fontSize: '12px', color: 'var(--accent-purple)' }}>{r.roomId}</code></td>
                            <td>
                              <strong>{r.name}</strong>
                              {r.isPrivate && <span style={{ fontSize: '10px', marginLeft: '6px', color: '#f59e0b' }}>🔒</span>}
                            </td>
                            <td>{r.language}</td>
                            <td>
                              <div>
                                <strong>{r.creator?.username || 'System'}</strong>
                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{r.creator?.email || ''}</div>
                              </div>
                            </td>
                            <td>
                              <span className={`status-pill ${r.isActive ? 'active' : 'inactive'}`}>
                                {r.isActive ? 'Đang hoạt động' : 'Offline'}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: r.onlineCount > 0 ? 'var(--accent, #34d399)' : '' }}>
                                {r.onlineCount} người
                              </strong>
                            </td>
                            <td>
                              <button className="delete-btn" onClick={() => handleForceCloseRoom(r.roomId, r.name)} style={{ padding: '6px 12px' }}>
                                <FiX size={13} /> Đóng
                              </button>
                            </td>
                          </tr>
                        ))}
                      {rooms.length === 0 && (
                        <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Chưa có phòng code nào hoạt động trong hệ thống</td></tr>
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
              <h3>Chỉnh sửa: {editingUser.username}</h3>
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
                  <small>Hệ thống sẽ tự động cập nhật phân hạng tương ứng sau khi lưu.</small>
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
              <h3>Import Đề Bài Codeforces</h3>
              <button className="close-btn" onClick={() => setShowImportModal(false)}><FiX size={16} /></button>
            </div>
            <form onSubmit={handleImportProblem}>
              <div className="admin-modal-body">
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' }}>
                  Nhập thông tin đề bài từ Codeforces. Hệ thống sẽ tự động cào đề bài, tải tài nguyên, và sinh bộ test case ẩn (verify qua reference solution) nếu bài tập chưa tồn tại trong cache.
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
                    <label>Index</label>
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
                  {importLoading ? 'Đang xử lý...' : 'Import Đề'}
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
              <h3>Testcases: {selectedProblem.contestId}-{selectedProblem.index}</h3>
              <button className="close-btn" onClick={() => setShowTestcaseModal(false)}><FiX size={16} /></button>
            </div>
            <div className="admin-modal-body">
              <div className="testcase-modal-top">
                <span className="p-badge">CF-{selectedProblem.contestId}-{selectedProblem.index} — {selectedProblem.name}</span>
                <div className="modal-actions-bar">
                  <button
                    className="ai-btn"
                    onClick={handleGenerateAiTestcases}
                    disabled={aiGenerating || testcaseLoading}
                  >
                    <FiCpu size={14} /> {aiGenerating ? 'Đang Sinh + Verify...' : '🔄 Sinh + Verify'}
                  </button>
                  <button className="add-testcase-btn" onClick={handleAddTestcase}>
                    <FiPlus size={14} /> Thêm Testcase
                  </button>
                </div>
              </div>

              {testcaseMessage && <div className="modal-alert info">{testcaseMessage}</div>}

              {testcaseLoading && !aiGenerating ? (
                <div className="loading-spinner-wrap"><div className="spinner" /><span>Đang tải testcases...</span></div>
              ) : (
                <div className="testcase-list">
                  {testcases.length === 0 ? (
                    <div className="no-testcases">
                      <FiDatabase size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                      <div>Chưa có testcase nào cho bài này.</div>
                      <div style={{ marginTop: '6px', opacity: 0.7 }}>Nhập thủ công hoặc click "Sinh bằng AI"</div>
                    </div>
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
                              Ẩn
                            </label>
                            <button className="tc-del-btn" onClick={() => handleRemoveTestcase(idx)} title="Xóa testcase">
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="testcase-row-io">
                          <div className="io-box">
                            <label>Input</label>
                            <textarea
                              value={tc.input}
                              onChange={(e) => handleTestcaseFieldChange(idx, 'input', e.target.value)}
                              placeholder="Input..."
                            />
                          </div>
                          <div className="io-box">
                            <label>Output</label>
                            <textarea
                              value={tc.output}
                              onChange={(e) => handleTestcaseFieldChange(idx, 'output', e.target.value)}
                              placeholder="Output..."
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
                {testcaseLoading ? 'Đang lưu...' : 'Lưu Testcase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;


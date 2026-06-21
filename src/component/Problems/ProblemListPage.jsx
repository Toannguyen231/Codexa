import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowRight, FiCode, FiSearch, FiUsers, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import './Problems.scss';
import {
  API_URL,
  DIFFICULTIES,
  formatSolvedCount,
  getDifficultyClass,
  getProblemRoomPath,
  getStatusIcon,
  readProblemStatuses,
  fetchProblemStatuses,
} from './problemUtils';

const CODEXA_LOGO = '/codexa-logo-transparent.png';

const getSelectedTags = (searchParams) => (
  (searchParams.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean)
);

const ProblemListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ items: [], topTags: [], total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
    fetchProblemStatuses(token).then((res) => {
      setStatuses(res || {});
    });
  }, []);

  const difficulty = searchParams.get('difficulty') || 'All';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || 1);
  const activeRoom = searchParams.get('activeRoom') === 'true';
  const selectedTags = useMemo(() => getSelectedTags(searchParams), [searchParams]);

  const updateQuery = useCallback((patch) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === 'All' || value === false) next.delete(key);
      else next.set(key, String(value));
    });

    if (!Object.prototype.hasOwnProperty.call(patch, 'page')) {
      next.delete('page');
    }

    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const toggleTag = (tag) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((item) => item !== tag)
      : [...selectedTags, tag];
    updateQuery({ tags: nextTags.join(',') });
  };

  const fetchProblems = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams(searchParams);
      params.set('limit', '20');
      const res = await fetch(`${API_URL}/problems?${params.toString()}`, {
        signal,
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || `Server trả về lỗi ${res.status}`);
      }

      const payload = await res.json();
      setData(payload);
      setWarning(payload.warning || '');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[ProblemList] Fetch error:', err);
        setError(err.message || 'Không thể kết nối tới server.');
        setData((prev) => ({ ...prev, items: [] }));
      }
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProblems(controller.signal);
    return () => controller.abort();
  }, [fetchProblems]);

  const handleRetry = () => {
    fetchProblems(new AbortController().signal);
  };

  const openProblemRoom = (problem) => {
    navigate(getProblemRoomPath(problem));
  };

  return (
    <div className="problems-page">
      <aside className="problems-sidebar">
        <div className="problems-brand" onClick={() => navigate('/rooms')} role="button" tabIndex={0}>
          <img src={CODEXA_LOGO} alt="Codexa logo" />
          <span>Codexa</span>
        </div>

        <div className="problem-filter-section">
          <label className="problem-filter-label" htmlFor="problem-search">Search</label>
          <div className="problem-search-wrap">
            <FiSearch size={14} />
            <input
              id="problem-search"
              value={search}
              onChange={(event) => updateQuery({ search: event.target.value })}
              placeholder="Tên bài..."
            />
          </div>
        </div>

        <div className="problem-filter-section">
          <div className="problem-filter-label">Difficulty</div>
          <div className="difficulty-options">
            {DIFFICULTIES.map((item) => (
              <button
                key={item}
                type="button"
                className={difficulty === item ? 'active' : ''}
                onClick={() => updateQuery({ difficulty: item })}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="problem-filter-section">
          <div className="problem-filter-label">Tags</div>
          <div className="tag-checklist">
            {(data.topTags || []).map(({ tag, count }) => (
              <label key={tag} className="tag-checkbox">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                <span>{tag}</span>
                <small>{count}</small>
              </label>
            ))}
          </div>
        </div>

        <label className="active-room-toggle">
          <input
            type="checkbox"
            checked={activeRoom}
            onChange={(event) => updateQuery({ activeRoom: event.target.checked })}
          />
          <span>Chỉ bài có phòng đang hoạt động</span>
        </label>
      </aside>

      <main className="problems-main">
        <header className="problems-header">
          <div>
            <h1>Algorithm Problems</h1>
            <div className="problems-slogan">Instant Code. Boundless Data.</div>
            <p>{data.total || 0} bài Codeforces phù hợp</p>
          </div>
          <div className="problems-header-actions">
            <button type="button" onClick={handleRetry} className="problems-refresh-btn" title="Tải lại">
              <FiRefreshCw size={13} /> Refresh
            </button>
            <button type="button" onClick={() => navigate('/rooms')} className="problems-back-btn">
              Về danh sách phòng
            </button>
          </div>
        </header>

        {warning && <div className="problems-warning">{warning}</div>}

        {error && (
          <div className="problems-error">
            <FiAlertCircle size={16} />
            <div className="problems-error-content">
              <strong>Lỗi tải danh sách bài</strong>
              <p>{error}</p>
              <small>Kiểm tra xem server backend có đang chạy tại {API_URL} không.</small>
            </div>
            <button type="button" onClick={handleRetry} className="problems-retry-btn">
              <FiRefreshCw size={13} /> Thử lại
            </button>
          </div>
        )}

        <div className="problem-table-wrap">
          <table className="problem-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Problem</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th>Solved</th>
                <th style={{ textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="problem-empty">
                    <div className="problem-table-loading">
                      <div className="problem-loading-spinner" />
                      <span>Đang tải danh sách bài từ Codeforces...</span>
                    </div>
                  </td>
                </tr>
              ) : data.items.length === 0 && !error ? (
                <tr><td colSpan="6" className="problem-empty">Không có bài phù hợp.</td></tr>
              ) : data.items.map((problem) => (
                <tr key={problem.id}>
                  <td className={`problem-status status-${statuses[problem.id] || 'unsolved'}`}>
                    {getStatusIcon(statuses[problem.id])}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="problem-name-btn"
                      onClick={() => navigate(`/problems/${problem.contestId}/${problem.index}`)}
                    >
                      {problem.name}
                    </button>
                    {problem.activeRoom && (
                      <span className="active-room-pill"><FiUsers size={11} /> {problem.activeRoom.onlineCount}</span>
                    )}
                  </td>
                  <td>
                    <span className={`difficulty-badge ${getDifficultyClass(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td>
                    <div className="problem-tags">
                      {problem.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                      {problem.tags.length > 3 && <span>+{problem.tags.length - 3} more</span>}
                    </div>
                  </td>
                  <td>{formatSolvedCount(problem.solvedCount)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="solve-solo-btn"
                        onClick={() => navigate(`/problems/${problem.contestId}/${problem.index}`)}
                      >
                        <FiCode size={12} /> Cá nhân
                      </button>
                      <button
                        type="button"
                        className="solve-team-btn"
                        onClick={() => openProblemRoom(problem)}
                      >
                        <FiUsers size={12} /> Giải nhóm
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="problem-pagination">
          <button type="button" disabled={page <= 1} onClick={() => updateQuery({ page: page - 1 })}>
            Previous
          </button>
          <span>Page {data.page || page} / {data.totalPages || 1}</span>
          <button
            type="button"
            disabled={page >= (data.totalPages || 1)}
            onClick={() => updateQuery({ page: page + 1 })}
          >
            Next <FiArrowRight size={13} />
          </button>
        </div>
      </main>
    </div>
  );
};

export default ProblemListPage;

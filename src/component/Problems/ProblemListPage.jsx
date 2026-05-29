import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowRight, FiCode, FiSearch, FiUsers } from 'react-icons/fi';
import './Problems.scss';
import {
  API_URL,
  DIFFICULTIES,
  formatSolvedCount,
  getDifficultyClass,
  getProblemRoomPath,
  getStatusIcon,
  readProblemStatuses,
} from './problemUtils';

const getSelectedTags = (searchParams) => (
  (searchParams.get('tags') || '').split(',').map((tag) => tag.trim()).filter(Boolean)
);

const ProblemListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ items: [], topTags: [], total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');
  const [statuses] = useState(readProblemStatuses);

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

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadProblems = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams);
        params.set('limit', '20');
        const res = await fetch(`${API_URL}/problems?${params.toString()}`, {
          signal: controller.signal,
        });
        const payload = await res.json();
        if (cancelled) return;

        if (!res.ok) throw new Error(payload.message || 'Không thể tải danh sách bài.');
        setData(payload);
        setWarning(payload.warning || '');
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setWarning(err.message);
          setData((prev) => ({ ...prev, items: [] }));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProblems();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [searchParams]);

  const openProblemRoom = (problem) => {
    navigate(getProblemRoomPath(problem));
  };

  return (
    <div className="problems-page">
      <aside className="problems-sidebar">
        <div className="problems-brand" onClick={() => navigate('/rooms')} role="button" tabIndex={0}>
          CodeRoom
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
            <p>{data.total || 0} bài Codeforces phù hợp</p>
          </div>
          <button type="button" onClick={() => navigate('/rooms')} className="problems-back-btn">
            Về danh sách phòng
          </button>
        </header>

        {warning && <div className="problems-warning">{warning}</div>}

        <div className="problem-table-wrap">
          <table className="problem-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Problem</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th>Solved</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="problem-empty">Đang tải bài...</td></tr>
              ) : data.items.length === 0 ? (
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
                    <button
                      type="button"
                      className="open-room-btn"
                      onClick={() => openProblemRoom(problem)}
                    >
                      <FiCode size={13} /> Open
                    </button>
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

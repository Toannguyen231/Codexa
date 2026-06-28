import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiSend, FiClock, FiUserPlus, FiTrendingUp, FiRefreshCw, FiChevronRight, FiCrosshair } from 'react-icons/fi';
import API from '../../api';
import Avatar from '../Avatar/Avatar.jsx';
import '../Avatar/Avatar.scss';
import './BattleHub.scss';

const RANK_COLORS = {
  'Sắt': '#A0AEC0',
  'Đồng': '#B45309',
  'Bạc': '#BFDBFE',
  'Vàng': '#FCD34D',
  'Tinh Anh': '#A78BFA',
  'Kim Cương': '#06B6D4',
  'Thách Đấu': '#FF6B6B',
};

const BattleHub = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ battleStats: {}, rank: 'Sắt', totalPoints: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [challengeUsername, setChallengeUsername] = useState('');
  const [challengeResult, setChallengeResult] = useState(null);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [challengeError, setChallengeError] = useState('');

  // ── Load stats & history ──
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          API.get('battle/stats'),
          API.get('battle/history', { params: { limit: '10' } }),
        ]);
        setStats(statsRes.data);
        setHistory(historyRes.data.items || []);
      } catch (err) {
        console.error('[BattleHub] Failed to load:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ── Challenge ──
  const handleChallenge = useCallback(async () => {
    if (!challengeUsername.trim()) return;
    setChallengeLoading(true);
    setChallengeError('');
    setChallengeResult(null);

    try {
      const { data } = await API.post('battle/invite', { username: challengeUsername.trim() });
      setChallengeResult(data);
    } catch (err) {
      setChallengeError(err.message);
    } finally {
      setChallengeLoading(false);
    }
  }, [challengeUsername]);

  const { battleStats } = stats;
  const winRate = battleStats.totalBattles > 0
    ? Math.round((battleStats.wins / battleStats.totalBattles) * 100)
    : 0;

  const renderResultBadge = (result) => {
    if (result === 'win') return <span className="battle-result-badge win">✅ Thắng</span>;
    if (result === 'lose') return <span className="battle-result-badge lose">🔴 Thua</span>;
    return <span className="battle-result-badge draw">🤝 Hoà</span>;
  };

  return (
    <div className="battle-hub">
      {/* ── Header ── */}
      <div className="battle-header">
        <div className="battle-header-left">
          <FiCrosshair className="battle-header-icon" />
          <div>
            <h1>Đấu Trường</h1>
            <p className="battle-subtitle">Code Battle 1v1</p>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate('/rooms')}>
          ← Quay lại
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="battle-stats-row">
        <div className="stat-card stat-rank">
          <div className="stat-label">Rank</div>
          <div className="stat-value" style={{ color: RANK_COLORS[stats.rank] || '#A0AEC0' }}>
            {stats.rank}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚔️ Số trận</div>
          <div className="stat-value">{battleStats.totalBattles || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">✅ Thắng</div>
          <div className="stat-value win">{battleStats.wins || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📈 Win rate</div>
          <div className="stat-value">{winRate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🔥 Streak</div>
          <div className="stat-value streak">{battleStats.currentStreak || 0}</div>
        </div>
      </div>

      {/* ── Main Actions ── */}
      <div className="battle-actions">
        <button className="battle-btn quick-match" onClick={() => navigate('/battle/queue')}>
          <FiZap className="btn-icon" />
          <div className="btn-content">
            <span className="btn-title">Đấu Ngay</span>
            <span className="btn-desc">Tìm đối thủ ngẫu nhiên</span>
          </div>
        </button>

        <div className="challenge-section">
          <div className="challenge-input-row">
            <FiUserPlus className="input-icon" />
            <input
              type="text"
              className="challenge-input"
              placeholder="Nhập tên đối thủ..."
              value={challengeUsername}
              onChange={(e) => setChallengeUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChallenge()}
            />
            <button
              className="challenge-btn"
              onClick={handleChallenge}
              disabled={challengeLoading || !challengeUsername.trim()}
            >
              {challengeLoading ? '...' : <FiSend />} Thách Đấu
            </button>
          </div>

          {/* Challenge Result */}
          {challengeResult && (
            <div className="challenge-result">
              <div className="challenge-players">
                <div className="challenge-player">
                  <Avatar username={challengeResult.me.username} />
                  <span className="challenge-name">{challengeResult.me.username}</span>
                  <span className="challenge-rank" style={{ color: RANK_COLORS[challengeResult.me.rank] }}>
                    {challengeResult.me.rank}
                  </span>
                </div>
                <span className="challenge-vs">⚔️ VS</span>
                <div className="challenge-player">
                  <Avatar username={challengeResult.opponent.username} />
                  <span className="challenge-name">{challengeResult.opponent.username}</span>
                  <span className="challenge-rank" style={{ color: RANK_COLORS[challengeResult.opponent.rank] }}>
                    {challengeResult.opponent.rank}
                  </span>
                </div>
              </div>
              <p className="challenge-hint">Đã tìm thấy! Lời mời đã được gửi đi.</p>
            </div>
          )}
          {challengeError && <p className="challenge-error">{challengeError}</p>}
        </div>
      </div>

      {/* ── History ── */}
      <div className="battle-history">
        <h3>
          <FiClock className="section-icon" /> Lịch Sử Battle
          {history.length > 0 && (
            <button className="view-all-btn" onClick={() => navigate('/battle')}>
              Xem tất cả <FiChevronRight />
            </button>
          )}
        </h3>

        {loading ? (
          <div className="loading-spinner">Đang tải...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <FiCrosshair className="empty-icon" />
            <p>Chưa có trận battle nào</p>
            <p className="empty-hint">Hãy tham gia đấu ngay để bắt đầu!</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => (
              <div
                key={item.id}
                className={`history-item ${item.result}`}
                onClick={() => navigate(`/battle/${item.roomId}`)}
              >
                <div className="history-opponent">
                  <Avatar username={item.opponent.username} />
                  <div>
                    <span className="history-name">{item.opponent.username}</span>
                    <span className="history-rank" style={{ color: RANK_COLORS[item.opponent.rank] }}>
                      {item.opponent.rank}
                    </span>
                  </div>
                </div>
                <div className="history-problem">
                  <span className="problem-id">{item.problem.contestId}{item.problem.index}</span>
                  <span className={`problem-diff ${item.problem.difficulty?.toLowerCase()}`}>
                    {item.problem.difficulty}
                  </span>
                </div>
                <div className="history-scores">
                  <span className="my-score">+{item.myScore}</span>
                  <span className="score-sep">-</span>
                  <span className="opp-score">+{item.opponentScore}</span>
                </div>
                {renderResultBadge(item.result)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleHub;

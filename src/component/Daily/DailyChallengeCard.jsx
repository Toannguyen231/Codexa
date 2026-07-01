import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight, FiClock, FiAward, FiCheckCircle, FiZap } from 'react-icons/fi';
import './DailyChallengeCard.scss';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('token') || '';

const DailyChallengeCard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    fetchDaily();
    const interval = setInterval(fetchDaily, 60000); // refresh mỗi phút
    return () => clearInterval(interval);
  }, []);

  // Countdown đến hết ngày
  useEffect(() => {
    if (data?.completed) return;
    const tick = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = end - now;
      if (diff <= 0) { setCountdown('Hết hạn'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data]);

  const fetchDaily = async () => {
    try {
      const res = await fetch(`${API_URL}/daily/today`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dc-card dc-loading">
        <div className="dc-shimmer" />
        <div className="dc-shimmer dc-shimmer-sm" />
      </div>
    );
  }

  if (error || !data?.challenge) {
    return null; // Ẩn nếu lỗi (graceful degradation)
  }

  const { challenge, completed, currentStreak, bestStreak, freezeRemaining } = data;

  const handleSolve = () => {
    if (challenge.contestId && challenge.index) {
      navigate(`/problems/${challenge.contestId}/${challenge.index}`);
    }
  };

  const difficultyColor = {
    Easy: '#4ade80',
    Medium: '#fbbf24',
    Hard: '#f87171',
  };

  return (
    <div className={`dc-card ${completed ? 'dc-completed' : ''}`}>
      {/* Streak indicator */}
      <div className="dc-streak-bar">
        <div className="dc-streak-item">
          <span className="dc-streak-icon">🔥</span>
          <span className="dc-streak-value">{currentStreak || 0}</span>
          <span className="dc-streak-label">ngày</span>
        </div>
        {bestStreak > 0 && (
          <div className="dc-streak-item">
            <span className="dc-streak-icon">🏆</span>
            <span className="dc-streak-value">{bestStreak}</span>
            <span className="dc-streak-label">kỷ lục</span>
          </div>
        )}
        {freezeRemaining > 0 && (
          <div className="dc-streak-item">
            <span className="dc-streak-icon">❄️</span>
            <span className="dc-streak-value">{freezeRemaining}</span>
            <span className="dc-streak-label">freeze</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="dc-body">
        <div className="dc-header">
          <FiZap size={16} className="dc-bolt" />
          <span className="dc-label">Daily Challenge</span>
          {!completed && (
            <span className="dc-countdown">
              <FiClock size={12} />
              {countdown}
            </span>
          )}
        </div>

        <h3 className="dc-title">{challenge.name}</h3>

        <div className="dc-meta">
          <span
            className="dc-difficulty"
            style={{ color: difficultyColor[challenge.difficulty] || '#94a3b8' }}
          >
            {challenge.difficulty || 'N/A'}
          </span>
          {challenge.tags && challenge.tags.length > 0 && (
            <span className="dc-tags">{challenge.tags.slice(0, 3).join(', ')}</span>
          )}
        </div>

        {completed ? (
          <div className="dc-done">
            <FiCheckCircle size={16} />
            <span>Đã hoàn thành hôm nay</span>
          </div>
        ) : (
          <button className="dc-btn-solve" onClick={handleSolve}>
            Giải ngay
            <FiChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Progress to next milestone */}
      {currentStreak > 0 && (
        <div className="dc-milestone">
          <div className="dc-milestone-label">
            <FiAward size={12} />
            Mốc tiếp theo: <strong>{nextMilestone(currentStreak)} ngày</strong>
          </div>
          <div className="dc-milestone-bar">
            <div
              className="dc-milestone-progress"
              style={{ width: `${milestoneProgress(currentStreak)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const MILESTONES = [3, 7, 14, 30, 60, 100];

const nextMilestone = (streak) => {
  for (const m of MILESTONES) {
    if (streak < m) return m;
  }
  return streak + 100;
};

const milestoneProgress = (streak) => {
  const next = nextMilestone(streak);
  const prev = MILESTONES.reduce((a, b) => (b < streak ? b : a), 0);
  const range = next - prev;
  const progress = ((streak - prev) / range) * 100;
  return Math.min(progress, 100);
};

export default DailyChallengeCard;

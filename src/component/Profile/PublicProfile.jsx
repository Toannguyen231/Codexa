import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAward, FiTarget, FiTrendingUp, FiZap } from 'react-icons/fi';
import API from '../../api';
import { resolveAvatar } from '../../utils/avatar';
import { getRankImage } from '../../utils/rankImages';
import HeatmapCalendar from './HeatmapCalendar.jsx';
import './PublicProfile.scss';

const RANK_COLORS = {
  'Sắt': '#A0AEC0',
  'Đồng': '#B45309',
  'Bạc': '#BFDBFE',
  'Vàng': '#FCD34D',
  'Tinh Anh': '#A78BFA',
  'Kim Cương': '#06B6D4',
  'Thách Đấu': '#FF6B6B',
};

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const timer = setTimeout(() => {
      setLoading(true);
      setError('');

      API.get(`/users/${userId}/profile`)
        .then(({ data }) => {
          if (data.success) {
            setProfileData(data);
          } else {
            setError('Không thể tải thông tin người dùng.');
          }
        })
        .catch((err) => {
          console.error('PublicProfile fetch error:', err);
          setError(err.message || 'Không tìm thấy người dùng.');
        })
        .finally(() => setLoading(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [userId]);

  if (loading) {
    return (
      <div className="pp-page">
        <div className="pp-loading">
          <div className="pp-spinner" />
          <span>Đang tải profile...</span>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="pp-page">
        <div className="pp-error">
          <h2>😔 Không tìm thấy</h2>
          <p>{error || 'Người dùng không tồn tại.'}</p>
          <button onClick={() => navigate(-1)} className="pp-btn-back">
            <FiArrowLeft size={14} /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  const user = profileData.user;
  const stats = profileData.stats;
  const activityData = profileData.activityData;
  const avatar = resolveAvatar(user);
  const rankColor = RANK_COLORS[user.rank] || '#A0AEC0';
  const battleStats = user.battleStats || {};
  const dailyStreak = user.dailyStreak || {};

  return (
    <div className="pp-page">
      {/* Top Navigation */}
      <nav className="pp-nav">
        <button onClick={() => navigate(-1)} className="pp-nav-back">
          <FiArrowLeft size={16} /> Quay lại
        </button>
        <span className="pp-nav-title">Profile Người Dùng</span>
      </nav>

      {/* Hero Section */}
      <div className="pp-hero" style={{ '--rank-glow': rankColor }}>
        <div className="pp-hero-bg" />
        <div className="pp-hero-content">
          <div className="pp-avatar-area">
            {avatar.type === 'image' ? (
              <img src={avatar.src} alt="" className="pp-avatar-img" />
            ) : (
              <div className="pp-avatar-initials" style={{ background: avatar.color }}>
                {avatar.initials}
              </div>
            )}
            <div className="pp-rank-badge-wrap">
              <img src={getRankImage(user.rank)} alt={user.rank} className="pp-rank-badge-img" />
            </div>
          </div>

          <div className="pp-identity">
            <h1 className="pp-username">{user.username}</h1>
            <div className="pp-rank-label" style={{ color: rankColor }}>
              {user.rank} · Vị trí #{user.rankPosition}
            </div>
            {user.bio && <p className="pp-bio">{user.bio}</p>}
            {user.createdAt && (
              <span className="pp-joined">
                Tham gia {new Date(user.createdAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="pp-container">
        <div className="pp-stats-row">
          <div className="pp-stat-card">
            <div className="pp-stat-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
              <FiTrendingUp size={18} />
            </div>
            <div className="pp-stat-data">
              <span className="pp-stat-value">{(user.totalPoints || 0).toLocaleString()}</span>
              <span className="pp-stat-label">Tổng Điểm</span>
            </div>
          </div>

          <div className="pp-stat-card">
            <div className="pp-stat-icon" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80' }}>
              <FiTarget size={18} />
            </div>
            <div className="pp-stat-data">
              <span className="pp-stat-value">{user.problemsSolved || 0}</span>
              <span className="pp-stat-label">Bài Giải</span>
            </div>
          </div>

          <div className="pp-stat-card">
            <div className="pp-stat-icon" style={{ background: 'rgba(234,179,8,0.1)', color: '#facc15' }}>
              <FiAward size={18} />
            </div>
            <div className="pp-stat-data">
              <span className="pp-stat-value">{stats?.submissionRate || '0%'}</span>
              <span className="pp-stat-label">Tỷ Lệ AC</span>
            </div>
          </div>

          <div className="pp-stat-card">
            <div className="pp-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
              <FiZap size={18} />
            </div>
            <div className="pp-stat-data">
              <span className="pp-stat-value">{battleStats.totalBattles || 0}</span>
              <span className="pp-stat-label">Trận Battle</span>
            </div>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="pp-section">
          <h2 className="pp-section-title">📊 Chi Tiết Theo Độ Khó</h2>
          <div className="pp-difficulty-grid">
            <div className="pp-diff-card easy">
              <div className="pp-diff-count">{user.easyProblems || 0}</div>
              <div className="pp-diff-name">Easy</div>
              <div className="pp-diff-pts">50 pts/bài</div>
            </div>
            <div className="pp-diff-card medium">
              <div className="pp-diff-count">{user.mediumProblems || 0}</div>
              <div className="pp-diff-name">Medium</div>
              <div className="pp-diff-pts">100 pts/bài</div>
            </div>
            <div className="pp-diff-card hard">
              <div className="pp-diff-count">{user.hardProblems || 0}</div>
              <div className="pp-diff-name">Hard</div>
              <div className="pp-diff-pts">200 pts/bài</div>
            </div>
          </div>
        </div>

        {/* Battle Stats */}
        {battleStats.totalBattles > 0 && (
          <div className="pp-section">
            <h2 className="pp-section-title">⚠️ Battle Stats</h2>
            <div className="pp-battle-grid">
              <div className="pp-battle-item">
                <span className="pp-battle-val win">{battleStats.wins || 0}</span>
                <span className="pp-battle-lbl">Thắng</span>
              </div>
              <div className="pp-battle-item">
                <span className="pp-battle-val loss">{battleStats.losses || 0}</span>
                <span className="pp-battle-lbl">Thua</span>
              </div>
              <div className="pp-battle-item">
                <span className="pp-battle-val draw">{battleStats.draws || 0}</span>
                <span className="pp-battle-lbl">Hòa</span>
              </div>
              <div className="pp-battle-item">
                <span className="pp-battle-val streak">{battleStats.bestStreak || 0}</span>
                <span className="pp-battle-lbl">Best Streak</span>
              </div>
            </div>
          </div>
        )}

        {/* Daily Streak */}
        {(dailyStreak.totalDailyDone > 0 || dailyStreak.bestStreak > 0) && (
          <div className="pp-section">
            <h2 className="pp-section-title">🔥 Daily Challenge</h2>
            <div className="pp-daily-grid">
              <div className="pp-daily-item">
                <span className="pp-daily-val">{dailyStreak.currentStreak || 0}</span>
                <span className="pp-daily-lbl">Current Streak</span>
              </div>
              <div className="pp-daily-item">
                <span className="pp-daily-val">{dailyStreak.bestStreak || 0}</span>
                <span className="pp-daily-lbl">Best Streak</span>
              </div>
              <div className="pp-daily-item">
                <span className="pp-daily-val">{dailyStreak.totalDailyDone || 0}</span>
                <span className="pp-daily-lbl">Total Done</span>
              </div>
            </div>
          </div>
        )}

        {/* Activity Heatmap */}
        <div className="pp-section">
          <HeatmapCalendar
            heatmapData={activityData?.heatmapData || []}
            currentStreak={activityData?.currentStreak || 0}
            bestStreak={activityData?.bestStreak || 0}
            username={user.username || ''}
          />
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;



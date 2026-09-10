import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { resolveAvatar } from '../../utils/avatar';
import { getRankImage } from '../../utils/rankImages';
import './ProfileHoverCard.scss';

const RANK_COLORS = {
  'Sắt': '#A0AEC0',
  'Đồng': '#B45309',
  'Bạc': '#BFDBFE',
  'Vàng': '#FCD34D',
  'Tinh Anh': '#A78BFA',
  'Kim Cương': '#06B6D4',
  'Thách Đấu': '#FF6B6B',
};

// Simple in-memory cache to avoid re-fetching the same profile
const profileCache = {};
const CACHE_TTL = 60000; // 1 minute

const ProfileHoverCard = ({ userId, children }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const cardRef = useRef(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    // Check cache
    const cached = profileCache[userId];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setProfile(cached.data);
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.get(`/users/${userId}/profile`);
      if (data.success) {
        setProfile(data);
        profileCache[userId] = { data: data, ts: Date.now() };
      }
    } catch (err) {
      console.error('Failed to fetch profile hover card:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 320;
    const cardHeight = 280;
    const margin = 8;

    let top = rect.bottom + margin;
    let left = rect.left + rect.width / 2 - cardWidth / 2;

    // Prevent overflowing right edge
    if (left + cardWidth > window.innerWidth - margin) {
      left = window.innerWidth - cardWidth - margin;
    }
    // Prevent overflowing left edge
    if (left < margin) {
      left = margin;
    }
    // If overflows bottom, show above trigger
    if (top + cardHeight > window.innerHeight - margin) {
      top = rect.top - cardHeight - margin;
    }

    setPosition({ top, left });
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      setVisible(true);
      calculatePosition();
      fetchProfile();
    }, 350);
  }, [calculatePosition, fetchProfile]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(showTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 200);
  }, []);

  const handleCardMouseEnter = useCallback(() => {
    clearTimeout(hideTimerRef.current);
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, 200);
  }, []);

  const handleCardClick = useCallback(() => {
    if (userId) {
      setVisible(false);
      navigate(`/user/${userId}`);
    }
  }, [userId, navigate]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  const user = profile?.user;
  const stats = profile?.stats;
  const avatar = user ? resolveAvatar(user) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className="phc-trigger"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {visible && (
        <div
          ref={cardRef}
          className="phc-card"
          style={{ top: position.top, left: position.left }}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
          onClick={handleCardClick}
        >
          {loading && !profile ? (
            <div className="phc-loading">
              <div className="phc-spinner" />
              <span>Đang tải...</span>
            </div>
          ) : user ? (
            <>
              {/* Header with gradient */}
              <div className="phc-header" style={{ '--rank-color': RANK_COLORS[user.rank] || '#A0AEC0' }}>
                <div className="phc-avatar-wrap">
                  {avatar?.type === 'image' ? (
                    <img src={avatar.src} alt="" className="phc-avatar-img" />
                  ) : (
                    <div className="phc-avatar-initials" style={{ background: avatar?.color }}>
                      {avatar?.initials}
                    </div>
                  )}
                </div>
                <div className="phc-identity">
                  <span className="phc-username">{user.username}</span>
                  <div className="phc-rank-row">
                    <img src={getRankImage(user.rank)} alt={user.rank} className="phc-rank-img" />
                    <span className="phc-rank-name" style={{ color: RANK_COLORS[user.rank] }}>
                      {user.rank}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="phc-bio">{user.bio.length > 60 ? user.bio.slice(0, 60) + '…' : user.bio}</div>
              )}

              {/* Stats grid */}
              <div className="phc-stats">
                <div className="phc-stat">
                  <span className="phc-stat-value">#{user.rankPosition}</span>
                  <span className="phc-stat-label">Vị trí</span>
                </div>
                <div className="phc-stat">
                  <span className="phc-stat-value">{(user.totalPoints || 0).toLocaleString()}</span>
                  <span className="phc-stat-label">Điểm</span>
                </div>
                <div className="phc-stat">
                  <span className="phc-stat-value">{user.problemsSolved || 0}</span>
                  <span className="phc-stat-label">Bài giải</span>
                </div>
                <div className="phc-stat">
                  <span className="phc-stat-value">{stats?.submissionRate || '0%'}</span>
                  <span className="phc-stat-label">Tỷ lệ AC</span>
                </div>
              </div>

              {/* Difficulty breakdown */}
              <div className="phc-difficulty">
                <span className="phc-diff easy">E {user.easyProblems || 0}</span>
                <span className="phc-diff medium">M {user.mediumProblems || 0}</span>
                <span className="phc-diff hard">H {user.hardProblems || 0}</span>
              </div>

              <div className="phc-footer">Xem profile →</div>
            </>
          ) : (
            <div className="phc-loading">
              <span>Không tìm thấy</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ProfileHoverCard;

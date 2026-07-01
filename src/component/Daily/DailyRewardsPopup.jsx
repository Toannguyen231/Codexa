import React, { useEffect, useRef } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import './DailyRewardsPopup.scss';

const DailyRewardsPopup = ({ show, data, onClose }) => {
  const prevShow = useRef(false);

  useEffect(() => {
    if (show && data && !prevShow.current) {
      prevShow.current = true;
    }
    if (!show) {
      prevShow.current = false;
    }
  }, [show, data]);

  // Auto-close after 8s
  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => {
      onClose();
    }, 8000);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show || !data) return null;

  const newMilestone = data.milestones?.length > 0;

  return (
    <div className="dr-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dr-popup ${newMilestone ? 'dr-milestone' : ''}`}>
        <button className="dr-close" onClick={onClose}>
          <FiX size={16} />
        </button>

        {/* Confetti animation */}
        <div className="dr-confetti">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={`dr-confetti-piece dr-cp-${i % 4}`} style={{ '--i': i }} />
          ))}
        </div>

        <div className="dr-icon">
          {newMilestone ? '🏆' : '🎉'}
        </div>

        <h2 className="dr-title">
          {newMilestone ? 'Milestone Achieved!' : 'Daily Challenge Complete!'}
        </h2>

        {newMilestone && (
          <div className="dr-milestone-badge">
            ⭐ Đã đạt mốc {data.newStreak} ngày!
          </div>
        )}

        <div className="dr-points">
          <div className="dr-points-total">
            <span className="dr-points-value">+{data.totalAwarded}</span>
            <span className="dr-points-label">điểm</span>
          </div>

          <div className="dr-points-breakdown">
            <div className="dr-breakdown-item">
              <span className="dr-bd-label">Điểm gốc</span>
              <span className="dr-bd-value">{data.basePoints}</span>
            </div>
            <div className="dr-breakdown-item">
              <span className="dr-bd-label">Daily Bonus x2</span>
              <span className="dr-bd-value dr-bd-bonus">+{data.bonusPoints}</span>
            </div>
            {data.streakBonus > 0 && (
              <div className="dr-breakdown-item">
                <span className="dr-bd-label">🔥 Streak Bonus</span>
                <span className="dr-bd-value dr-bd-streak">+{data.streakBonus}</span>
              </div>
            )}
          </div>
        </div>

        <div className="dr-streak-info">
          <span>🔥 Streak: <strong>{data.newStreak}</strong> ngày</span>
        </div>

        <button className="dr-btn-continue" onClick={onClose}>
          <FiCheck size={14} /> Tiếp tục
        </button>
      </div>
    </div>
  );
};

export default DailyRewardsPopup;

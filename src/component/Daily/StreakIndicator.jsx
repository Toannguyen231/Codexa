import React, { useEffect, useState } from 'react';
import './StreakIndicator.scss';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const getToken = () => localStorage.getItem('accessToken') || localStorage.getItem('token') || '';

const parseJsonResponse = async (res) => {
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
};

const StreakIndicator = ({ compact = false }) => {
  const [streak, setStreak] = useState(null);

  const fetchStreak = async () => {
    try {
      const res = await fetch(`${API_URL}/daily/streak`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const json = await parseJsonResponse(res);
      if (json.success) setStreak(json);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    const initial = setTimeout(fetchStreak, 0);
    const interval = setInterval(fetchStreak, 120000); // refresh m?i 2p
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  if (!streak || streak.currentStreak === 0) return null;

  return (
    <div className="sr-indicator">
      <span className="sr-fire">🔥</span>
      <span className="sr-count">{streak.currentStreak}</span>
      {!compact && <span className="sr-label" />}

      {/* Tooltip */}
      <div className="sr-tooltip">
        <div className="sr-tooltip-header">
          🔥 Streak {streak.currentStreak} ngày
        </div>
        <div className="sr-tooltip-body">
          {streak.completed
            ? '✅ Đã hoàn thành daily hôm nay!'
            : '⚡ Giải daily challenge để giữ streak!'}
          <br />
          🏆 Kỷ lục: {streak.bestStreak} ngày
          <br />
          📅 Tổng: {streak.totalDailyDone} daily đã làm
        </div>
        {streak.freezeRemaining > 0 && (
          <div className="sr-tooltip-freeze">
            ❄️ Còn {streak.freezeRemaining} lần giữ streak
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakIndicator;


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiClock, FiUsers, FiZap } from 'react-icons/fi';
import { io } from 'socket.io-client';
import './BattleQueue.scss';

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const BattleQueue = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('connecting'); // connecting | queue | countdown | matched
  const [queueLength, setQueueLength] = useState(0);
  const [timer, setTimer] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    const socket = io(`${SERVER_URL}/battle`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('queue');
      socket.emit('battle-join-queue');
    });

    socket.on('battle-queue-joined', ({ queueLength: ql }) => {
      setQueueLength(ql);
      // Start timer
      timerRef.current = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    });

    socket.on('battle-queue-update', ({ queueLength: ql }) => {
      setQueueLength(ql);
    });

    socket.on('battle-matched', (data) => {
      setStatus('matched');
      setMatchData(data);
      clearInterval(timerRef.current);
    });

    socket.on('battle-countdown', ({ countdown: cd }) => {
      setStatus('countdown');
      setCountdown(cd);
    });

    socket.on('battle-start', () => {
      // Redirect to battle room
      navigate(`/battle/${matchData?.roomId}`);
    });

    socket.on('battle-error', ({ message }) => {
      alert(message);
      navigate('/battle');
    });

    socket.on('disconnect', () => {
      setStatus('connecting');
    });

    return () => {
      clearInterval(timerRef.current);
      socket.emit('battle-leave-queue');
      socket.disconnect();
    };
  }, []);

  const handleCancel = () => {
    socketRef.current?.emit('battle-leave-queue');
    navigate('/battle');
  };

  return (
    <div className="queue-screen">
      {/* ── Matching State ── */}
      {(status === 'queue' || status === 'connecting') && (
        <div className="queue-card">
          <div className="queue-search-animation">
            <div className="search-ring"></div>
            <FiZap className="search-icon" />
          </div>

          <h2>Đang tìm đối thủ...</h2>

          <div className="queue-timer">
            <FiClock className="timer-icon" />
            <span>{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
          </div>

          <div className="queue-stats">
            <div className="queue-stat">
              <FiUsers />
              <span>Đang chờ: <strong>{queueLength}</strong> người</span>
            </div>
            <div className="queue-stat">
              <FiZap />
              <span>Phạm vi: Cùng rank</span>
            </div>
          </div>

          <button className="cancel-btn" onClick={handleCancel}>
            <FiX /> Huỷ tìm trận
          </button>
        </div>
      )}

      {/* ── Matched State ── */}
      {status === 'matched' && matchData && (
        <div className="matched-card">
          <div className="matched-glow"></div>
          <h2>✅ Đã tìm thấy!</h2>

          <div className="matched-players">
            <div className="matched-player">
              <div className="matched-avatar">{/* Avatar will be added */}</div>
              <span className="matched-name">Bạn</span>
            </div>
            <span className="matched-vs">⚔️</span>
            <div className="matched-player">
              <div className="matched-avatar opponent">{/* Avatar will be added */}</div>
              <span className="matched-name">{matchData.opponent?.username}</span>
            </div>
          </div>

          <div className="matched-info">
            <p>📝 <strong>{matchData.problem?.contestId}{matchData.problem?.index}</strong> — {matchData.problem?.name}</p>
            <p>📊 Độ khó: {matchData.problem?.difficulty}</p>
            <p>⏱️ {Math.floor(matchData.timeLimit / 60)} phút</p>
          </div>
        </div>
      )}

      {/* ── Countdown State ── */}
      {status === 'countdown' && (
        <div className="countdown-overlay">
          <div className="countdown-number">{countdown}</div>
          <p>Trận đấu sắp bắt đầu...</p>
        </div>
      )}
    </div>
  );
};

export default BattleQueue;

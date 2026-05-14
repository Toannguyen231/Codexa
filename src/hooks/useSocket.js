import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// src/hooks/useSocket.js (hoặc file tương ứng của bạn)
const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

/**
 * Hook: useSocket — quản lý kết nối Socket.IO cho real-time code sync
 *
 * @param {string} roomId - ID phòng cần join
 * @param {string} token - JWT token để xác thực
 *
 * Trả về: { socket, onlineUsers, isConnected }
 */
const useSocket = (roomId, token) => {
  const socketRef = useRef(null);
  const [socketState, setSocketState] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId || !token) return;

    // Tạo kết nối Socket.IO, gửi token qua auth
    const socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // ── Connection events ──────────────────────────────────────────
    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setIsConnected(true);
      setSocketState(socket); // Trigger re-render để CodeApp nhận được socket
      // Join room ngay khi kết nối thành công
      socket.emit('join-room', roomId);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('🔌 Socket connect error:', err.message);
      setIsConnected(false);
    });

    // ── Room events ────────────────────────────────────────────────
    socket.on('users-update', (users) => {
      console.log('📥 users-update received:', users);
      setOnlineUsers(users);
    });

    socket.on('room-error', (msg) => {
      console.error('Room error:', msg);
    });

    // Cleanup khi unmount hoặc roomId/token thay đổi
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketState(null);
    };
  }, [roomId, token]);

  return {
    socket: socketState,
    onlineUsers,
    isConnected,
  };
};

export default useSocket;

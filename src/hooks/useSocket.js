import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { clearSessionToken, getOrCreateSessionToken } from '../utils/sessionToken';

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

/**
 * Hook: useSocket
 * Quản lý kết nối Socket.IO với cơ chế tránh double-connect khi re-render.
 *
 * - Dùng ref để track connection đang tồn tại, không tạo mới nếu roomId + token không đổi.
 * - Xử lý đúng race condition khi unmount.
 */
const useSocket = (roomId, token) => {
  const socketRef = useRef(null);
  const [socketState, setSocketState] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Track các cleanup dependencies để tránh reconnect không cần thiết
  const prevDepsRef = useRef('');

  useEffect(() => {
    if (!roomId || !token) return undefined;

    const depsKey = `${roomId}:${token}`;
    // Nếu roomId + token không đổi thì không reconnect
    if (socketRef.current && prevDepsRef.current === depsKey) {
      return undefined;
    }
    prevDepsRef.current = depsKey;

    let cancelled = false;

    const connectSocket = async () => {
      // Disconnect socket cũ nếu có
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      setConnectionStatus('connecting');

      try {
        const sessionToken = await getOrCreateSessionToken();
        if (cancelled) return;

        const socket = io(SERVER_URL, {
          auth: { token, sessionToken },
          query: { token: sessionToken },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000,
          randomizationFactor: 0,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          if (cancelled) return;
          setIsConnected(true);
          setConnectionStatus('connected');
          setSocketState(socket);
          socket.emit('join-room', roomId);
        });

        socket.on('disconnect', () => {
          if (cancelled) return;
          setIsConnected(false);
          setConnectionStatus('disconnected');
        });

        socket.on('connect_error', (err) => {
          if (cancelled) return;
          setIsConnected(false);
          setConnectionStatus('error');

          if (err.data?.code === 4001) {
            clearSessionToken();
            socket.disconnect();
          }
        });

        socket.io.on('reconnect_attempt', () => {
          if (!cancelled) setConnectionStatus('connecting');
        });

        socket.io.on('reconnect', () => {
          if (!cancelled) setConnectionStatus('connected');
        });

        socket.io.on('reconnect_error', () => {
          if (!cancelled) setConnectionStatus('error');
        });

        socket.on('users-update', (users) => {
          if (!cancelled) setOnlineUsers(users);
        });

        socket.on('room-error', (msg) => {
          console.error('Room error:', msg);
        });
      } catch (err) {
        console.error('Socket session error:', err.message);
        if (!cancelled) {
          setIsConnected(false);
          setConnectionStatus('error');
        }
      }
    };

    connectSocket();

    return () => {
      cancelled = true;
      // Chỉ disconnect nếu đây là cleanup cho dependencies hiện tại
      if (prevDepsRef.current === depsKey) {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setSocketState(null);
        setConnectionStatus('disconnected');
        prevDepsRef.current = '';
      }
    };
  }, [roomId, token]);

  return {
    socket: socketState,
    onlineUsers,
    isConnected,
    connectionStatus,
  };
};

export default useSocket;

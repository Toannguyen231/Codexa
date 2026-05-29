import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { clearSessionToken, getOrCreateSessionToken } from '../utils/sessionToken';

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

const useSocket = (roomId, token) => {
  const socketRef = useRef(null);
  const [socketState, setSocketState] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    if (!roomId || !token) return undefined;

    let cancelled = false;

    const connectSocket = async () => {
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
          setIsConnected(true);
          setConnectionStatus('connected');
          setSocketState(socket);
          socket.emit('join-room', roomId);
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
          setConnectionStatus('disconnected');
        });

        socket.on('connect_error', (err) => {
          setIsConnected(false);
          setConnectionStatus('error');

          if (err.data?.code === 4001) {
            clearSessionToken();
            socket.disconnect();
          }
        });

        socket.io.on('reconnect_attempt', () => {
          setConnectionStatus('connecting');
        });

        socket.io.on('reconnect', () => {
          setConnectionStatus('connected');
        });

        socket.io.on('reconnect_error', () => {
          setConnectionStatus('error');
        });

        socket.on('users-update', (users) => {
          setOnlineUsers(users);
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
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketState(null);
      setConnectionStatus('disconnected');
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

import { useCallback, useEffect, useRef, useState } from 'react';

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

const normalizeMessage = (message) => (
  typeof message === 'string' ? message : JSON.stringify(message)
);

const getReconnectDelay = (attempt) => Math.min(
  INITIAL_RECONNECT_DELAY * (2 ** attempt),
  MAX_RECONNECT_DELAY
);

/**
 * Native WebSocket hook with reconnect and offline send queue.
 *
 * @param {string} url
 * @param {{
 *   onMessage?: (event: MessageEvent) => void,
 *   onOpen?: (event: Event) => void,
 *   onClose?: (event: CloseEvent) => void,
 * }} options
 */
export const useWebSocket = (url, options = {}) => {
  const [status, setStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);

  const socketRef = useRef(null);
  const connectRef = useRef(null);
  const queueRef = useRef([]);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(true);
  const callbacksRef = useRef(options);

  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  const flushQueue = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    while (queueRef.current.length > 0) {
      socket.send(queueRef.current.shift());
    }
  }, []);

  const connect = useCallback(() => {
    if (!url || typeof WebSocket === 'undefined') return;

    window.clearTimeout(reconnectTimerRef.current);
    setStatus('connecting');

    const socket = new WebSocket(url);
    socketRef.current = socket;
    setSocketInstance(socket);

    socket.onopen = (event) => {
      reconnectAttemptRef.current = 0;
      setStatus('connected');
      flushQueue();
      callbacksRef.current.onOpen?.(event);
    };

    socket.onmessage = (event) => {
      setLastMessage(event);
      callbacksRef.current.onMessage?.(event);
    };

    socket.onerror = () => {
      setStatus('error');
    };

    socket.onclose = (event) => {
      socketRef.current = null;
      setSocketInstance(null);
      setStatus(event.code === 1000 ? 'disconnected' : 'disconnected');
      callbacksRef.current.onClose?.(event);

      if (!shouldReconnectRef.current) return;

      const delay = getReconnectDelay(reconnectAttemptRef.current);
      reconnectAttemptRef.current += 1;
      reconnectTimerRef.current = window.setTimeout(() => {
        connectRef.current?.();
      }, delay);
    };
  }, [flushQueue, url]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    const initialConnect = window.setTimeout(connect, 0);

    return () => {
      shouldReconnectRef.current = false;
      window.clearTimeout(initialConnect);
      window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close(1000, 'Component unmounted');
      socketRef.current = null;
      queueRef.current = [];
    };
  }, [connect]);

  const sendMessage = useCallback((message) => {
    const payload = normalizeMessage(message);
    const socket = socketRef.current;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(payload);
      return true;
    }

    queueRef.current.push(payload);
    return false;
  }, []);

  const close = useCallback(() => {
    shouldReconnectRef.current = false;
    window.clearTimeout(reconnectTimerRef.current);
    socketRef.current?.close(1000, 'Closed by client');
  }, []);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    socketRef.current?.close(1000, 'Manual reconnect');
    connect();
  }, [connect]);

  return {
    socket: socketInstance,
    status,
    lastMessage,
    sendMessage,
    close,
    reconnect,
  };
};

export default useWebSocket;

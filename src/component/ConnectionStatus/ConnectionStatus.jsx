import React from 'react';
import './ConnectionStatus.scss';

const STATUS_LABELS = {
  connecting: 'Reconnecting',
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Connection error',
};

const normalizeStatus = (status) => (
  STATUS_LABELS[status] ? status : 'disconnected'
);

const ConnectionStatus = ({ status = 'disconnected' }) => {
  const normalized = normalizeStatus(status);

  return (
    <div
      className={`connection-status connection-status-${normalized}`}
      title={STATUS_LABELS[normalized]}
      aria-live="polite"
    >
      <span className="connection-status-dot" aria-hidden="true" />
      <span className="connection-status-label">{STATUS_LABELS[normalized]}</span>
    </div>
  );
};

export default ConnectionStatus;

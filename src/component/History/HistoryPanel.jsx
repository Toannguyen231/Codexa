import React, { useState, useEffect } from 'react';
import { FiClock, FiX, FiRotateCcw, FiSave } from 'react-icons/fi';
import './HistoryPanel.scss';

const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit',
    });
};

const HistoryPanel = ({ roomId, token, onRestore, onClose, socket, isConnected, currentCode, currentLanguage, currentUser }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selected, setSelected] = useState(null); // index của snapshot đang xem preview

    // Load lịch sử từ API
    const fetchHistory = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            const res = await fetch(`${apiUrl}/rooms/${roomId}/history`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setHistory(data.history || []);
        } catch {
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, [roomId]);

    // Lắng nghe snapshot mới từ socket (người khác save)
    useEffect(() => {
        if (!socket) return;
        const handler = (snap) => {
            setHistory((prev) => [snap, ...prev].slice(0, 20));
        };
        socket.on('snapshot-saved', handler);
        return () => socket.off('snapshot-saved', handler);
    }, [socket]);

    // Save snapshot hiện tại
    const handleSave = () => {
        if (!socket || !isConnected) return;
        setSaving(true);
        socket.emit('save-snapshot', {
            roomId,
            code: currentCode,
            language: currentLanguage,
        });
        setTimeout(() => setSaving(false), 1000);
    };

    // Khôi phục snapshot
    const handleRestore = (snap) => {
        if (window.confirm(`Khôi phục code lúc ${formatTime(snap.savedAt)}?\nCode hiện tại sẽ bị thay thế.`)) {
            onRestore(snap.code, snap.language);
            onClose();
        }
    };

    return (
        <div className="history-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="history-panel">
                {/* Header */}
                <div className="history-header">
                    <div className="history-title">
                        <FiClock size={15} />
                        Lịch sử Code
                    </div>
                    <div className="history-actions">
                        <button className={`btn-save-snap ${saving ? 'saved' : ''}`} onClick={handleSave} disabled={!isConnected}>
                            <FiSave size={13} />
                            {saving ? 'Đã lưu!' : 'Lưu snapshot'}
                        </button>
                        <button className="btn-close-history" onClick={onClose}>
                            <FiX size={15} />
                        </button>
                    </div>
                </div>

                <div className="history-body">
                    {/* List */}
                    <div className="history-list">
                        {loading ? (
                            <div className="history-empty">Đang tải...</div>
                        ) : history.length === 0 ? (
                            <div className="history-empty">
                                Chưa có snapshot nào.<br />
                                Nhấn "Lưu snapshot" để lưu code hiện tại.
                            </div>
                        ) : (
                            history.map((snap, idx) => (
                                <div
                                    key={snap._id || idx}
                                    className={`history-item ${selected === idx ? 'selected' : ''}`}
                                    onClick={() => setSelected(selected === idx ? null : idx)}
                                >
                                    <div className="history-item-left">
                                        <div className="history-item-time">{formatTime(snap.savedAt)}</div>
                                        <div className="history-item-meta">
                                            <span className="lang-tag">{snap.language}</span>
                                            <span className="saved-by">by {snap.savedBy}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn-restore"
                                        onClick={(e) => { e.stopPropagation(); handleRestore(snap); }}
                                        title="Khôi phục snapshot này"
                                    >
                                        <FiRotateCcw size={13} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Preview */}
                    {selected !== null && history[selected] && (
                        <div className="history-preview">
                            <div className="preview-label">Preview — {formatTime(history[selected].savedAt)}</div>
                            <pre className="preview-code">{history[selected].code}</pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPanel;
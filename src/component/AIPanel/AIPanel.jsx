import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import { FiX, FiCpu, FiMessageSquare, FiZap, FiTool, FiSend, FiTrash2 } from 'react-icons/fi';
import './AIPanel.scss';
import API, { fetchRaw } from '../../api';

const getUserId = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').id || 'guest';
  } catch {
    return 'guest';
  }
};

const getLocalKey = () => `ai-chat-${getUserId()}`;

const AIPanel = ({ code, language, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef([]);
  const streamMetaRef = useRef(null);
  const aiTextRef = useRef('');
  const lastSavedKeyRef = useRef('');

  const token = localStorage.getItem('token');
  const isAuth = Boolean(token);

  messagesRef.current = messages;

  const persistLocal = useCallback((msgs) => {
    try {
      const slim = msgs
        .filter((m) => m.text)
        .map((m) => ({ role: m.role, text: m.text, isError: !!m.isError }));
      localStorage.setItem(getLocalKey(), JSON.stringify(slim));
    } catch {
      // ignore quota errors
    }
  }, []);

  const saveHistory = useCallback(async (type, question, answer, extra = {}) => {
    if (!token || !question || !answer) return false;

    const dedupeKey = `${type}|${question}|${answer.slice(0, 80)}`;
    if (lastSavedKeyRef.current === dedupeKey) return true;
    lastSavedKeyRef.current = dedupeKey;

    setSaveStatus('saving');
    try {
      const { data } = await API.post('ai/history', {
        type,
        question,
        answer,
        code: extra.code || '',
        language: extra.language || '',
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
      return true;
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
      return false;
    }
  }, [token, code, language]);

  const flushPendingSave = useCallback(() => {
    const meta = streamMetaRef.current;
    const answer = aiTextRef.current;
    if (!meta?.type || !meta?.question || !answer?.trim()) return;
    saveHistory(meta.type, meta.question, answer, meta.extra);
    streamMetaRef.current = null;
    aiTextRef.current = '';
  }, [saveHistory]);

  const loadHistory = useCallback(async () => {
    let restored = [];

    if (token) {
      try {
        const { data } = await API.get('ai/history', { params: { limit: '30' } });
        if (data.items?.length) {
          data.items.slice().reverse().forEach((h) => {
            restored.push({ role: 'user', text: h.question });
            restored.push({ role: 'ai', text: h.answer, isError: h.answer.startsWith('🚨') });
          });
        }
      } catch {
        // fallback local
      }
    }

    if (!restored.length) {
      try {
        const local = JSON.parse(localStorage.getItem(getLocalKey()) || '[]');
        if (Array.isArray(local) && local.length) restored = local;
      } catch {
        // ignore
      }
    }

    if (restored.length) setMessages(restored);
  }, [token]);

  const clearHistory = async () => {
    if (!window.confirm('Xóa toàn bộ lịch sử trò chuyện AI?')) return;
    setMessages([]);
    localStorage.removeItem(getLocalKey());
    lastSavedKeyRef.current = '';
    if (token) {
      try {
        await API.delete('ai/history');
      } catch {
        // local đã xóa
      }
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const streamResponse = async (endpoint, payload, meta) => {
    setLoading(true);
    streamMetaRef.current = { ...meta, extra: { code: payload.code, language: payload.language } };
    aiTextRef.current = '';

    setMessages((prev) => [...prev, { role: 'ai', text: '', isStreaming: true }]);

    let aiText = '';
    let errorText = '';

    try {
      const response = await fetchRaw(`ai/${endpoint}`, {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        let errMsg = `Lỗi hệ thống: ${response.status}`;
        try {
          const errData = await response.json();
          errMsg = errData.message || errMsg;
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      if (!response.body) throw new Error('No body returned');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              setMessages((prev) => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1].isStreaming = false;
                return newMsgs;
              });
              break;
            }
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                aiText += data.text;
                aiTextRef.current = aiText;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].text = aiText;
                  return newMsgs;
                });
              } catch (e) {
                console.error('Error parsing JSON chunk', e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      errorText = `🚨 ${err.message}`;
      aiTextRef.current = errorText;
      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].text = errorText;
        newMsgs[newMsgs.length - 1].isStreaming = false;
        newMsgs[newMsgs.length - 1].isError = true;
        return newMsgs;
      });
    } finally {
      setLoading(false);
      const answer = aiText || errorText;
      if (meta?.type && meta?.question && answer.trim()) {
        await saveHistory(meta.type, meta.question, answer, {
          code: payload.code,
          language: payload.language,
        });
      }
      streamMetaRef.current = null;
      aiTextRef.current = '';
    }
  };

  const handleExplain = () => {
    const question = 'Giải thích đoạn code này giúp tôi.';
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    streamResponse('explain', { code, language }, { type: 'explain', question });
  };

  const handleFixBugs = () => {
    const question = 'Tìm và sửa lỗi trong code này.';
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    streamResponse('fix', { code, language }, { type: 'fix', question });
  };

  const handleOptimize = () => {
    const question = 'Tối ưu hoá đoạn code này.';
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    streamResponse('optimize', { code, language }, { type: 'optimize', question });
  };

  const handleSendMessage = () => {
    const text = userInput.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setUserInput('');
    streamResponse('chat', { message: text, code, language }, { type: 'chat', question: text });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    flushPendingSave();
    persistLocal(messagesRef.current);
    onClose();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Luôn backup local mỗi khi messages thay đổi
  useEffect(() => {
    if (messages.length > 0) persistLocal(messages);
  }, [messages, persistLocal]);

  useEffect(() => {
    inputRef.current?.focus();
    if (token) loadHistory();
    return () => {
      flushPendingSave();
      persistLocal(messagesRef.current);
    };
  }, [token, loadHistory, flushPendingSave, persistLocal]);

  return (
    <Rnd
      default={{
        x: window.innerWidth - 450,
        y: 100,
        width: 400,
        height: 550,
      }}
      minWidth={320}
      minHeight={420}
      bounds=".app-shell"
      dragHandleClassName="ai-panel-header"
      className="ai-panel-container"
    >
      <div className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-title">
            <FiCpu size={15} />
            AI Assistant (Gemini)
            {saveStatus === 'saving' && <span className="ai-save-badge saving">Đang lưu...</span>}
            {saveStatus === 'saved' && <span className="ai-save-badge saved">Đã lưu</span>}
            {saveStatus === 'error' && <span className="ai-save-badge error">Lưu local</span>}
          </div>
          <div className="ai-header-actions">
            {messages.length > 0 && (
              <button type="button" className="btn-clear-history" onClick={clearHistory} title="Xóa lịch sử">
                <FiTrash2 size={13} />
              </button>
            )}
            <button type="button" className="btn-close" onClick={handleClose}><FiX size={15} /></button>
          </div>
        </div>

        <div className="ai-suggestions">
          <button type="button" onClick={handleExplain} disabled={loading}><FiMessageSquare /> Explain</button>
          <button type="button" onClick={handleFixBugs} disabled={loading}><FiTool /> Fix Bugs</button>
          <button type="button" onClick={handleOptimize} disabled={loading}><FiZap /> Optimize</button>
        </div>

        <div className="ai-chat-history">
          {messages.length === 0 ? (
            <div className="ai-empty">
              <div className="ai-empty-icon">🤖</div>
              <p>Chọn thao tác bên trên hoặc nhập câu hỏi. Lịch sử được lưu tự động.</p>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`ai-msg-row ${m.role}`}>
                <div className={`ai-bubble ${m.isError ? 'error' : ''}`}>
                  {m.role === 'ai' && m.isStreaming && <span className="ai-typing">●</span>}
                  <pre>{m.text}</pre>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-input-area">
          <textarea
            ref={inputRef}
            className="ai-input"
            placeholder="Hỏi AI về code của bạn... (Enter để gửi)"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
          />
          <button
            type="button"
            className={`ai-send-btn ${userInput.trim() ? 'active' : ''}`}
            onClick={handleSendMessage}
            disabled={loading || !userInput.trim()}
            title="Gửi câu hỏi (Enter)"
          >
            {loading ? <span className="ai-send-loading">⏳</span> : <FiSend size={16} />}
          </button>
        </div>
      </div>
    </Rnd>
  );
};

export default AIPanel;

import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { FiX, FiCpu, FiMessageSquare, FiZap, FiTool } from 'react-icons/fi';
import './AIPanel.scss';

const AIPanel = ({ code, language, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');

  const streamResponse = async (endpoint, payload) => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'ai', text: '', isStreaming: true }]);

    try {
      const response = await fetch(`http://localhost:3001/api/ai/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errMsg = `Lỗi hệ thống: ${response.status}`;
        try {
           const errData = await response.json();
           errMsg = `Lỗi từ Server: ${errData.message || response.statusText}`;
        } catch(e) {}
        throw new Error(errMsg);
      }

      if (!response.body) throw new Error("No body returned");

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let aiText = '';
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') {
              setMessages(prev => {
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
                
                // Update last message
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].text = aiText;
                  return newMsgs;
                });
              } catch (e) {
                console.error("Error parsing JSON chunk", e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].text = `🚨 ${err.message}`;
        newMsgs[newMsgs.length - 1].isStreaming = false;
        newMsgs[newMsgs.length - 1].isError = true;
        return newMsgs;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = () => {
    setMessages(prev => [...prev, { role: 'user', text: 'Giải thích đoạn code này giúp tôi.' }]);
    streamResponse('explain', { code, language });
  };

  const handleFixBugs = () => {
    setMessages(prev => [...prev, { role: 'user', text: 'Tìm và sửa lỗi trong code này.' }]);
    streamResponse('fix', { code, language });
  };

  const handleOptimize = () => {
    setMessages(prev => [...prev, { role: 'user', text: 'Tối ưu hoá đoạn code này.' }]);
    streamResponse('optimize', { code, language });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Rnd
      default={{
        x: window.innerWidth - 450,
        y: 100,
        width: 400,
        height: 500
      }}
      minWidth={300}
      minHeight={400}
      bounds=".app-shell"
      dragHandleClassName="ai-panel-header"
      className="ai-panel-container"
    >
      <div className="ai-panel">
        <div className="ai-panel-header">
          <div className="ai-title">
            <FiCpu size={15} /> 
            AI Assistant (Gemini)
          </div>
          <button className="btn-close" onClick={onClose}><FiX size={15} /></button>
        </div>
        
        <div className="ai-suggestions">
          <button onClick={handleExplain} disabled={loading}><FiMessageSquare /> Explain</button>
          <button onClick={handleFixBugs} disabled={loading}><FiTool /> Fix Bugs</button>
          <button onClick={handleOptimize} disabled={loading}><FiZap /> Optimize</button>
        </div>

        <div className="ai-chat-history">
          {messages.length === 0 ? (
            <div className="ai-empty">
              Chọn một thao tác bên trên để AI phân tích code hiện tại của bạn.
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`ai-msg-row ${m.role}`}>
                <div className="ai-bubble">
                  {m.role === 'ai' && m.isStreaming && <span className="ai-typing">●</span>}
                  <pre>{m.text}</pre>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </Rnd>
  );
};

export default AIPanel;

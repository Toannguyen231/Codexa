import React, { useState, useRef, useCallback } from 'react';
import './OutputPanel.scss';
import { FiTerminal, FiCheckSquare, FiTrash2 } from 'react-icons/fi';
import { Oval } from 'react-loader-spinner'
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 500;
const DEFAULT_HEIGHT = 220;

const OutputPanel = ({ output, isRunning, onClear, stdin, setStdin }) => {
  const [activeTab, setActiveTab] = useState('console');
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const dragRef = useRef(null);

  const getStatus = () => {
    if (isRunning) return { label: 'Running', cls: 'running' };
    if (!output) return { label: 'Idle', cls: 'idle' };
    if (output.toLowerCase().includes('error')) return { label: 'Error', cls: 'error' };
    return { label: 'Accepted', cls: 'accepted' };
  };

  const status = getStatus();

  const handleClearCode = () => {
    if (onClear) onClear();
  };



  // ─── Drag to resize ───────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;

    const onMouseMove = (moveEvent) => {
      // Kéo lên → tăng chiều cao, kéo xuống → giảm
      const delta = startY - moveEvent.clientY;
      const newH = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + delta));
      setHeight(newH);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [height]);



  return (
    <div className="output-panel" style={{ height }}>
      {/* ── Drag Handle ── */}
      <div
        className="resize-handle"
        ref={dragRef}
        onMouseDown={handleMouseDown}
      />

      {/* Tabs */}
      <div className="output-tabs">
        <div
          id="tab-console"
          className={`output-tab ${activeTab === 'console' ? 'active' : ''}`}
          onClick={() => setActiveTab('console')}
        >
          <FiTerminal size={12} />
          Console
        </div>
        <div
          id="tab-testcase"
          className={`output-tab ${activeTab === 'testcase' ? 'active' : ''}`}
          onClick={() => setActiveTab('testcase')}
        >
          <FiCheckSquare size={12} />
          Test Cases
        </div>

        <div className="output-tab-actions">
          <button className="btn-clear" title="Clear output" onClick={handleClearCode}>
            <FiTrash2 size={11} style={{ marginRight: 4 }} />
            Clear
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="output-body">
        {activeTab === 'console' ? (
          isRunning ? (
            <span className="console-output">
              <Oval
                width={20}
                height={20}
                color="#4fa94d"
                visible={true}
                ariaLabel="oval-loading"
                secondaryColor="#4fa94d"
                strokeWidth={2}
                strokeWidthSecondary={2}
              />
            </span>
          ) : output ? (
            <pre className={`console-output ${output.toLowerCase().includes('error') ? 'error' : 'success'}`}>
              {output}
            </pre>
          ) : (
            <span className="console-empty">Nhấn "Run Code" để chạy chương trình...</span>
          )
        ) : (
          <div className="testcase-area" style={{ height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Input (stdin)</label>
            <textarea 
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              className="stdin-textarea"
              placeholder="Nhập input cho chương trình ở đây..."
              style={{
                flex: 1, backgroundColor: '#1e1e1e', color: '#d4d4d4', 
                border: '1px solid #333', borderRadius: '4px', padding: '8px',
                fontFamily: 'Consolas, monospace', fontSize: '13px', resize: 'none',
                outline: 'none'
              }}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="output-status">
        <span className={`status-badge ${status.cls}`}>{status.label}</span>
        {output && !isRunning && (
          <span className="status-time">
            {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};

export default OutputPanel;

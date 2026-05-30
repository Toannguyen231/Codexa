import React, { useState, useRef, useCallback } from 'react';
import './OutputPanel.scss';
import { FiTerminal, FiCheckSquare, FiTrash2 } from 'react-icons/fi';
import { Oval } from 'react-loader-spinner'
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 500;
const DEFAULT_HEIGHT = 220;

const OutputPanel = ({ output, isRunning, onClear, stdin, setStdin, samples = [], testResults = null, runningTests = false, onRunAllTests }) => {
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
          {activeTab === 'testcase' && (
            <button 
              className="run-tests-btn-sm" 
              onClick={onRunAllTests} 
              disabled={runningTests || samples.length === 0}
              title="Chạy tất cả testcases mẫu"
            >
              {runningTests ? 'Đang chạy...' : 'Run All Tests'}
            </button>
          )}
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
          <div className="testcase-area-container">
            {/* Test Results List */}
            <div className="testcases-list-section">
              {samples.length === 0 ? (
                <div className="console-empty">
                  Không tìm thấy sample test cases trong đề bài.
                </div>
              ) : (
                <div className="test-results-list" style={{ marginTop: '8px' }}>
                  <div className="test-summary-bar">
                    <span className="test-summary-count">{samples.length} test case{samples.length > 1 ? 's' : ''}</span>
                    {testResults && (
                      <span className="test-summary-result">
                        <span className="passed-count">✓ {testResults.filter(t => t.status === 'Passed').length}</span>
                        <span className="failed-count">✗ {testResults.filter(t => t.status !== 'Passed' && t.status !== 'Pending' && t.status !== 'Running').length}</span>
                      </span>
                    )}
                  </div>
                  {samples.map((sample, i) => {
                    const result = testResults?.[i];
                    const statusClass = result ? result.status.toLowerCase().replace(' ', '-') : 'pending';
                    return (
                      <div key={i} className={`test-case-card ${statusClass}`}>
                        <div className="test-case-header">
                          <span className="test-case-title">
                            {sample.isHidden ? `Hidden ${i + 1} 🔒` : `Sample ${i + 1}`}
                          </span>
                          {result && <span className="test-case-status">{result.status}</span>}
                        </div>
                        <div className="test-case-body">
                          <div className="test-case-io">
                            <div className="io-col">
                              <strong>Input</strong>
                              <pre>{sample.input}</pre>
                            </div>
                            <div className="io-col">
                              <strong>Expected Output</strong>
                              <pre>{sample.output}</pre>
                            </div>
                            {result && (
                              <div className="io-col">
                                <strong>Actual Output</strong>
                                <pre className={result.status === 'Failed' || result.status === 'Runtime Error' || result.status === 'Compile Error' ? 'error-text' : result.status === 'Passed' ? 'passed-text' : ''}>
                                  {result.actualOutput !== null ? result.actualOutput : (result.status === 'Running' ? '⏳ Đang chạy...' : '—')}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiSend, FiPlay, FiChevronDown, FiChevronUp, FiZap, FiUser, FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { io } from 'socket.io-client';
import API, { fetchRaw } from '../../api';
import CodeEditor from '../Editor/CodeEditor';
import LanguageSelector from '../Header/LanguageSelector';
import './BattleRoom.scss';

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const DEFAULT_CODE = `#include <iostream>
using namespace std;

int main() {
  // Your code here
  return 0;
}`;

const LANGUAGE_TEMPLATES = {
  'C++': DEFAULT_CODE,
  Python: `def main():\n    pass\n\nif __name__ == "__main__":\n    main()`,
  Java: `public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`,
  JavaScript: `function main() {\n    // Your code here\n}\n\nmain();`,
};

const BattleRoom = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || '';

  // ── Core state ──
  const [problem, setProblem] = useState(null);
  const [fullProblem, setFullProblem] = useState(null); // Full details including test cases
  const [language, setLanguage] = useState('C++');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES['C++']);
  const [mySide, setMySide] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | active | finished | countdown
  const [timeLeft, setTimeLeft] = useState(1800);
  const [startedAt, setStartedAt] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // ── Opponent ──
  const [opponent, setOpponent] = useState(null);
  const [opponentStatus, setOpponentStatus] = useState('idle'); // idle | coding | submitted | ac

  // ── Socket ──
  const socketRef = useRef(null);
  const submitCountRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  // ── IO panel ──
  const [ioPanelOpen, setIoPanelOpen] = useState(OPtrue);
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [outputLoading, setOutputLoading] = useState(false);

  // ── Submit ──
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState(null); // { isAccepted, score }
  const [testResults, setTestResults] = useState([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(-1);

  // ── Kết thúc ──
  const [finishedData, setFinishedData] = useState(null);

  // ── Refs for latest values (avoid stale closures) ──
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  const statusRef = useRef(status);
  const typingEmitRef = useRef(0);
  const handleSubmitRef = useRef(null);

  // Keep refs synced
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { statusRef.current = status; }, [status]);
  // handleSubmitRef is updated via layout effect below

  // ── Fetch full problem details ──
  const fetchProblemDetails = async (contestId, index) => {
    try {
      const res = await API.get(`/problems/${contestId}/${index}`);
      setFullProblem(res.data.problem);
    } catch (err) {
      console.error('Failed to fetch full problem:', err);
    }
  };

  // ── Kết nối socket ──
  useEffect(() => {
    if (!token || !roomId) return;

    const socket = io(`${SERVER_URL}/battle`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('battle-join-room', { roomId });
    });

    socket.on('battle-room-data', (data) => {
      setProblem(data.problem);
      setOpponent(data.opponent);
      setMySide(data.mySide);
      setStatus(data.status);
      if (data.startedAt) setStartedAt(data.startedAt);

      if (data.problem?.contestId && data.problem?.index) {
        fetchProblemDetails(data.problem.contestId, data.problem.index);
      }
    });

    socket.on('battle-countdown', ({ countdown: cd }) => {
      setStatus('countdown');
      setCountdown(cd);
    });

    socket.on('battle-timer', ({ timeLeft: tl }) => {
      setTimeLeft(tl);
    });

    socket.on('battle-start', ({ problem: p, timeLimit, startedAt: sa }) => {
      setProblem(p);
      setStartedAt(sa);
      setStatus('active');
      setTimeLeft(timeLimit || 1800);
      if (p?.contestId && p?.index) {
        fetchProblemDetails(p.contestId, p.index);
      }
    });

    socket.on('battle-opponent-submitted', ({ submitCount, verdict }) => {
      if (verdict === 'AC') {
        setOpponentStatus('ac');
      } else {
        setOpponentStatus('submitted');
        // Reset to idle after 3s
        setTimeout(() => setOpponentStatus('idle'), 3000);
      }
    });

    socket.on('battle-opponent-typing', () => {
      setOpponentStatus(prev => {
        if (prev === 'ac') return prev;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setOpponentStatus('idle');
        }, 2000);
        return 'coding';
      });
    });

    socket.on('battle-submit-result', (result) => {
      setSubmitResult({ isAccepted: result.isAccepted, score: result.score });
    });

    socket.on('battle-finished', (data) => {
      setStatus('finished');
      setFinishedData(data);
    });

    socket.on('battle-error', ({ message }) => {
      alert(message);
      navigate('/battle');
    });

    return () => {
      socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [roomId, token]);

  // Keep handleSubmitRef current on every render
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  // ── Timer ──
  useEffect(() => {
    if (status !== 'active' || !startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 1800 - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (submitCountRef.current === 0) {
          // Use refs to avoid stale closure
          handleSubmitRef.current(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status, startedAt]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const timerColor = timeLeft <= 300 ? '#ef4444' : timeLeft <= 600 ? '#f59e0b' : status === 'finished' ? '#64748b' : '#10b981';

  // ── Typing Handler ──
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (status === 'active' && socketRef.current) {
      const now = Date.now();
      if (now - typingEmitRef.current > 1000) {
        socketRef.current.emit('battle-typing', { roomId });
        typingEmitRef.current = now;
      }
    }
  };

  // ── Chạy code ──
  const handleRunCode = async () => {
    if (outputLoading || !code.trim()) return;
    setOutputLoading(true);
    setOutput('');

    try {
      const res = await fetchRaw('code/execute', {
        method: 'POST',
        body: { language, code, stdin: customInput },
      });
      const result = await res.json();

      if (!res.ok) {
        setOutput(result.message || 'Lỗi server');
      } else if (result.compile_output) {
        setOutput(result.compile_output);
      } else {
        const stdout = result.stdout || '';
        const stderr = result.stderr || '';
        setOutput(stdout + (stderr ? `\n--- stderr ---\n${stderr}` : ''));
      }
    } catch (err) {
      setOutput(`Lỗi: ${err.message}`);
    } finally {
      setOutputLoading(false);
    }
  };

  const handleSubmit = async (isAuto = false) => {
    // Use refs for code/language to avoid stale closure on timer auto-submit
    const currentCode = codeRef.current;
    const currentLanguage = languageRef.current;

    if (submitLoading || statusRef.current !== 'active') return;
    setSubmitLoading(true);
    setTestResults([]);
    setSubmitResult(null);
    setCurrentTestIndex(0);

    try {
      // Get test cases (sample tests from API response)
      let testcases = [];
      if (fullProblem && fullProblem.sampleTestcases && fullProblem.sampleTestcases.length > 0) {
        testcases = fullProblem.sampleTestcases;
      } else {
        // Fallback: try to use old format or create placeholder
        testcases = [{ input: '', output: '' }];
      }

      // Limit to max 5 testcases to avoid very long waits during battle
      const testsToRun = testcases.slice(0, 5);
      const results = [];
      let passedCount = 0;
      let isAccepted = true;

      for (let i = 0; i < testsToRun.length; i++) {
        setCurrentTestIndex(i);
        const test = testsToRun[i];

        const res = await fetchRaw('code/execute', {
          method: 'POST',
          body: { language: currentLanguage, code: currentCode, stdin: test.input || '' },
        });

        const result = await res.json();

        let status = 'Failed';
        let actualOutput = '';

        if (!res.ok) {
          status = 'CE';
          actualOutput = result.message || 'Error';
          isAccepted = false;
        } else if (result.compile_output) {
          status = 'CE';
          actualOutput = result.compile_output;
          isAccepted = false;
        } else if (result.status?.id === 5) {
          status = 'TLE';
          isAccepted = false;
        } else if (result.status?.id !== 3 && result.status?.id !== undefined) {
          status = 'RTE';
          actualOutput = result.stderr || 'Runtime Error';
          isAccepted = false;
        } else {
          actualOutput = (result.stdout || '').trim();
          const expectedOutput = (test.output || '').trim();

          if (testcases.length === 1 && !test.input && !test.output) {
            // Fake testcase handling
            status = 'Passed';
            passedCount++;
          } else if (actualOutput === expectedOutput) {
            status = 'Passed';
            passedCount++;
          } else {
            status = 'WA';
            isAccepted = false;
          }
        }

        results.push({
          testNumber: i + 1,
          status,
          actualOutput,
          expectedOutput: test.output || '',
        });

        setTestResults([...results]);

        // Short-circuit if failed (optional, but good for speed)
        if (!isAccepted) break;
      }

      // Emit to server
      submitCountRef.current += 1;
      socketRef.current?.emit('battle-submit', {
        roomId,
        code: currentCode,
        language: currentLanguage,
        results: {
          isAccepted,
          passedCount,
          totalCount: testsToRun.length
        }
      });

      if (!isAuto) {
        if (isAccepted) {
          alert('✅ Bài làm đã được ghi nhận! Chờ đối thủ hoàn thành...');
        } else {
          // alert is a bit intrusive for quick battle typing, but keeping as requested/old logic
        }
      }
    } catch (err) {
      console.error('[Battle Submit]', err);
    } finally {
      setSubmitLoading(false);
      setCurrentTestIndex(-1);
    }
  };

  // ── Render ──
  if (status === 'loading') {
    return (
      <div className="battle-room-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải trận đấu...</p>
      </div>
    );
  }

  if (status === 'countdown') {
    return (
      <div className="battle-room-countdown">
        <div className="countdown-content">
          <h2>Trận đấu sắp bắt đầu!</h2>
          <div className="countdown-number">{countdown}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`battle-room ${status === 'finished' ? 'finished' : ''}`}>
      {/* ── Top Bar ── */}
      <div className="battle-topbar">
        <button className="battle-back-btn" onClick={() => navigate('/battle')}>
          ← Quay lại
        </button>

        <div className="battle-problem-info">
          {problem && (
            <>
              <span className="battle-problem-id">{problem.contestId}{problem.index}</span>
              <span className="battle-problem-name">{problem.name}</span>
              <span className={`battle-diff ${problem.difficulty?.toLowerCase()}`}>{problem.difficulty}</span>
            </>
          )}
        </div>

        <div className="battle-timer" style={{ color: timerColor }}>
          <FiClock />
          <span className="timer-text">{formatTime(timeLeft)}</span>
        </div>

        <div className="battle-opponent-info">
          <FiUser />
          <span className="opponent-name">{opponent?.username || '???'}</span>
          <span className={`opponent-status ${opponentStatus}`}>
            {opponentStatus === 'ac' ? '🏆 Đã AC' : opponentStatus === 'submitted' ? '📨 Đã submit' : opponentStatus === 'coding' ? '💻 Đang code' : '⏳ Chờ...'}
          </span>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="battle-main">
        {/* ── Problem Statement ── */}
        <div className="battle-problem-panel">
          <div className="panel-header">
            <h3>📝 Đề bài</h3>
          </div>
          <div className="panel-body problem-statement">
            {fullProblem?.statementHtml || problem?.statementHtml ? (
              <div dangerouslySetInnerHTML={{ __html: fullProblem?.statementHtml || problem.statementHtml }} />
            ) : (
              <div className="problem-placeholder">
                <p><strong>{problem?.name || 'Bài tập'}</strong></p>
                {problem?.tags && <p className="problem-tags">Tags: {problem.tags.join(', ')}</p>}
                {problem?.rating && <p>Rating: {problem.rating}</p>}
                <p className="problem-hint">Đang tải đề bài...</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Code Panel ── */}
        <div className="battle-code-panel">
          <div className="battle-editor-header">
            <LanguageSelector language={language} setLanguage={setLanguage} />
            <div className="battle-actions">
              <button className="battle-run-btn" onClick={handleRunCode} disabled={outputLoading || status === 'finished'}>
                <FiPlay /> {outputLoading ? 'Running...' : 'Run'}
              </button>
              <button
                className={`battle-submit-btn ${submitLoading ? 'loading' : ''}`}
                onClick={() => handleSubmit(false)}
                disabled={submitLoading || status === 'finished'}
              >
                <FiSend /> {submitLoading ? 'Đang chấm...' : 'Submit'}
              </button>
            </div>
          </div>

          <div className="battle-editor-wrapper">
            <CodeEditor
              code={code}
              setCode={handleCodeChange}
              language={language}
              hideToolbar={true}
              settings={{ theme: 'vs-dark', fontSize: 14, tabSize: 4 }}
            />
          </div>

          {/* ── Testing Progress Panel ── */}
          {submitLoading && (
            <div className="battle-testing-progress">
              <h4>Đang chấm bài...</h4>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.max(10, ((currentTestIndex + 1) / 5) * 100)}%` }}
                ></div>
              </div>
              <p>Test case {currentTestIndex + 1} / 5</p>
            </div>
          )}

          {/* ── Test Results Panel ── */}
          {!submitLoading && testResults.length > 0 && (
            <div className="battle-test-results">
              <h4>Kết quả Test Cases</h4>
              <div className="test-cases-list">
                {testResults.map((tr, i) => (
                  <div key={i} className={`test-case-item ${tr.status === 'Passed' ? 'passed' : 'failed'}`}>
                    <span className="test-case-name">Test {tr.testNumber}:</span>
                    <span className="test-case-status">{tr.status}</span>
                    {tr.status !== 'Passed' && tr.status !== 'Passed (Fake)' && (
                      <div className="test-case-details">
                        <div className="detail-box">
                          <strong>Output:</strong>
                          <pre>{tr.actualOutput}</pre>
                        </div>
                        {tr.expectedOutput && (
                          <div className="detail-box">
                            <strong>Expected:</strong>
                            <pre>{tr.expectedOutput}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── IO Panel ── */}
          <div className="battle-io-panel">
            <div className="io-header" onClick={() => setIoPanelOpen(!ioPanelOpen)}>
              <span>📟 Input / Output (Tự chọn)</span>
              {ioPanelOpen ? <FiChevronDown /> : <FiChevronUp />}
            </div>

            {ioPanelOpen && (
              <div className="io-body">
                <div className="io-section">
                  <label>Input:</label>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Nhập input tùy chỉnh..."
                    rows={4}
                    disabled={status === 'finished'}
                  />
                </div>
                <div className="io-section">
                  <label>Output:</label>
                  <pre className="io-output">{output || 'Chạy code để xem kết quả...'}</pre>
                </div>
              </div>
            )}
          </div>

          {/* ── Submit Result ── */}
          {submitResult !== null && (
            <div className={`submit-banner ${submitResult.isAccepted ? 'accepted' : 'failed'}`}>
              {submitResult.isAccepted ? (
                <><FiCheckCircle /> ✅ AC! Chờ đối thủ hoàn thành... (Điểm: {submitResult.score})</>
              ) : (
                <><FiXCircle /> ❌ Chưa chính xác. Cố lên!</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Finished Modal ── */}
      {status === 'finished' && finishedData && (
        <div className="battle-result-overlay">
          <div className="battle-result-card">
            <div className={`result-badge ${finishedData.winner ? (finishedData.winner === (mySide === 'player1' ? finishedData.player1.id : finishedData.player2.id) ? 'win' : 'lose') : 'draw'}`}>
              {finishedData.winner
                ? (finishedData.winner === (mySide === 'player1' ? finishedData.player1.id : finishedData.player2.id)
                  ? '🏆 CHIẾN THẮNG!'
                  : '😞 THẤT BẠI')
                : '🤝 HOÀ'}
            </div>

            <div className="result-players">
              <div className="result-player">
                <div className="result-player-name">Bạn</div>
                <div className="result-score">{mySide === 'player1' ? finishedData.player1.score : finishedData.player2.score}</div>
                <div className={`result-verdict ${mySide === 'player1' ? (finishedData.player1.ac ? 'ac' : 'wa') : (finishedData.player2.ac ? 'ac' : 'wa')}`}>
                  {mySide === 'player1' ? (finishedData.player1.ac ? '✅ AC' : '❌ WA') : (finishedData.player2.ac ? '✅ AC' : '❌ WA')}
                </div>
              </div>
              <span className="result-vs">⚔️</span>
              <div className="result-player">
                <div className="result-player-name">{opponent?.username}</div>
                <div className="result-score">{mySide === 'player1' ? finishedData.player2.score : finishedData.player1.score}</div>
                <div className={`result-verdict ${mySide === 'player1' ? (finishedData.player2.ac ? 'ac' : 'wa') : (finishedData.player1.ac ? 'ac' : 'wa')}`}>
                  {mySide === 'player1' ? (finishedData.player2.ac ? '✅ AC' : '❌ WA') : (finishedData.player1.ac ? '✅ AC' : '❌ WA')}
                </div>
              </div>
            </div>

            <div className="result-problem">
              <p><strong>{finishedData.problem?.contestId}{finishedData.problem?.index}</strong> — {finishedData.problem?.name}</p>
            </div>

            <div className="result-actions">
              <button className="result-btn primary" onClick={() => navigate('/battle/queue')}>
                <FiZap /> Đấu tiếp
              </button>
              <button className="result-btn secondary" onClick={() => navigate('/battle')}>
                ← Về Battle Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleRoom;

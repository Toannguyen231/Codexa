import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPlay,
  FiSend,
  FiExternalLink,
  FiRefreshCw,
  FiTerminal,
  FiCheckCircle,
  FiXCircle,
  FiCopy,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import CodeEditor from '../Editor/CodeEditor';
import LanguageSelector from '../Header/LanguageSelector';
import './Problems.scss';
import {
  API_URL,
  LANGUAGE_TEMPLATES,
  buildProblemUrl,
  getDifficultyClass,
  getProblemRoomPath,
  writeProblemStatus,
} from './problemUtils';

const DEFAULT_SETTINGS = {
  theme: 'vs-dark',
  fontSize: 14,
  minimap: false,
  wordWrap: 'on',
};

const getProblemHeader = (problem, language) => {
  const commentPrefix = language === 'Python' ? '#' : '//';
  const lines = [
    `${commentPrefix} Codeforces ${problem.contestId}${problem.index}: ${problem.name}`,
    `${commentPrefix} ${buildProblemUrl(problem)}`,
    `${commentPrefix} Difficulty: ${problem.difficulty}${problem.rating ? ` (${problem.rating})` : ''}`,
    problem.tags?.length ? `${commentPrefix} Tags: ${problem.tags.join(', ')}` : '',
  ].filter(Boolean);
  return lines.join('\n');
};

const buildStarterCode = (problem, language) => {
  const template = LANGUAGE_TEMPLATES[language] || LANGUAGE_TEMPLATES['C++'];
  return `${getProblemHeader(problem, language)}\n\n${template}`;
};

/* ── Trích sample input/output từ HTML đã scrape ── */
const extractSamples = (html) => {
  if (!html) return [];
  const samples = [];
  const sampleTestRegex = /<div class="sample-test">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  const inputRegex = /<div class="input">[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;
  const outputRegex = /<div class="output">[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi;

  // Simpler approach — find all <pre> inside .input and .output blocks
  const inputBlocks = [];
  const outputBlocks = [];

  const inputMatch = html.matchAll(/<div class="input">[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi);
  for (const m of inputMatch) {
    inputBlocks.push(m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim());
  }

  const outputMatch = html.matchAll(/<div class="output">[\s\S]*?<pre[^>]*>([\s\S]*?)<\/pre>/gi);
  for (const m of outputMatch) {
    outputBlocks.push(m[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim());
  }

  for (let i = 0; i < Math.max(inputBlocks.length, outputBlocks.length); i++) {
    samples.push({
      input: inputBlocks[i] || '',
      output: outputBlocks[i] || '',
    });
  }

  return samples;
};

const ProblemPage = () => {
  const { contestId, index } = useParams();
  const navigate = useNavigate();

  // Core state
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('C++');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');

  // Custom Input / Output panel
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [runStatus, setRunStatus] = useState(null); // { id, description }
  const [running, setRunning] = useState(false);
  const [activeIOTab, setActiveIOTab] = useState('input'); // 'input' | 'output'
  const [ioPanelOpen, setIoPanelOpen] = useState(true);

  // Samples extracted from the scraped HTML
  const [samples, setSamples] = useState([]);

  const statementRef = useRef(null);
  const token = localStorage.getItem('token') || '';

  const problemUrl = useMemo(() => (problem ? buildProblemUrl(problem) : ''), [problem]);

  // ── Load Problem + Scrape Statement ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadProblem = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/problems/${contestId}/${index}`, {
          signal: controller.signal,
        });
        const payload = await res.json();
        if (cancelled) return;

        if (!res.ok) throw new Error(payload.message || 'Không thể tải bài.');
        setProblem(payload.problem);
        setWarning(payload.warning || '');
        setCode(buildStarterCode(payload.problem, language));

        // Extract sample test cases from scraped HTML
        if (payload.problem?.statementHtml) {
          const extracted = extractSamples(payload.problem.statementHtml);
          setSamples(extracted);
          // Pre-fill custom input with first sample input
          if (extracted.length > 0 && extracted[0].input) {
            setCustomInput(extracted[0].input);
          }
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setWarning(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProblem();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [contestId, index]);

  // ── Run Code via Wandbox ───────────────────────────────────────────
  const handleRunCode = useCallback(async () => {
    if (running || !code.trim()) return;
    setRunning(true);
    setOutput('');
    setRunStatus(null);
    setActiveIOTab('output');

    try {
      const res = await fetch(`${API_URL}/code/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          language,
          code,
          stdin: customInput,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setOutput(result.message || 'Lỗi server.');
        setRunStatus({ id: 0, description: 'Error' });
        return;
      }

      // compile error
      if (result.compile_output) {
        setOutput(result.compile_output);
        setRunStatus(result.status || { id: 6, description: 'Compilation Error' });
        return;
      }

      const stdout = result.stdout || '';
      const stderr = result.stderr || '';
      setOutput(stdout + (stderr ? `\n--- stderr ---\n${stderr}` : ''));
      setRunStatus(result.status || { id: 3, description: 'Finished' });
    } catch (err) {
      setOutput(`Lỗi kết nối: ${err.message}`);
      setRunStatus({ id: 0, description: 'Error' });
    } finally {
      setRunning(false);
    }
  }, [running, code, customInput, language, token]);

  // ── Helpers ────────────────────────────────────────────────────────
  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    if (problem) setCode(buildStarterCode(problem, nextLanguage));
  };

  const handleSubmit = () => {
    if (!problem) return;
    writeProblemStatus(problem.id, 'attempted');
    window.alert('Submit judging sẽ được nối ở phase tiếp theo.');
  };

  const handleRetryLoad = () => window.location.reload();

  const handleUseSample = (sampleInput) => {
    setCustomInput(sampleInput);
    setActiveIOTab('input');
  };

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(output).catch(() => {});
  };

  const statusColor = runStatus
    ? runStatus.id === 3
      ? '#10b981'
      : runStatus.id === 6
        ? '#f59e0b'
        : '#ef4444'
    : null;

  // ── Loading / Error states ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="problem-page-loading">
        <div className="problem-loading-spinner" />
        <span>Đang tải đề bài từ Codeforces...</span>
        <small style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Server đang scrape HTML từ codeforces.com — có thể mất vài giây lần đầu
        </small>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="problem-page-loading">
        <p>Không tìm thấy bài.</p>
        <button type="button" onClick={() => navigate('/problems')}>Quay lại danh sách</button>
      </div>
    );
  }

  return (
    <div className="problem-page">
      {/* ── Header ── */}
      <header className="problem-page-header">
        <button type="button" onClick={() => navigate('/problems')} className="problem-back-btn">
          <FiArrowLeft size={14} /> Problems
        </button>
        <div className="problem-title-block">
          <h1>{problem.contestId}{problem.index} — {problem.name}</h1>
          <div className="problem-title-meta">
            <span className={`difficulty-badge ${getDifficultyClass(problem.difficulty)}`}>
              {problem.difficulty}{problem.rating ? ` (${problem.rating})` : ''}
            </span>
            {problem.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="problem-tag-pill">{tag}</span>
            ))}
            <span className="problem-solved-count">✓ {problem.solvedCount?.toLocaleString() || 0}</span>
          </div>
        </div>
        <a
          href={problemUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="problem-external-link"
          title="Mở trên Codeforces"
        >
          <FiExternalLink size={14} /> Codeforces
        </a>
      </header>

      {warning && <div className="problems-warning" style={{ margin: '0 24px' }}>{warning}</div>}

      {/* ── Workspace: 2 panel layout ── */}
      <div className="problem-workspace">

        {/* ── LEFT: Problem Statement (scraped) ── */}
        <section className="problem-statement-panel">
          {problem.statementHtml ? (
            <div
              ref={statementRef}
              className="problem-scraped-content"
              dangerouslySetInnerHTML={{ __html: problem.statementHtml }}
            />
          ) : (
            <div className="problem-statement-fallback">
              <div className="fallback-icon">📋</div>
              <h2>Không thể tải đề bài</h2>
              <p>
                Server không thể scrape đề bài từ Codeforces.
                Có thể do rate-limit hoặc bài không tồn tại.
              </p>
              <div className="fallback-actions">
                <button type="button" onClick={handleRetryLoad}>
                  <FiRefreshCw size={13} /> Thử lại
                </button>
                <a href={problemUrl} target="_blank" rel="noopener noreferrer">
                  <FiExternalLink size={13} /> Xem trên Codeforces
                </a>
              </div>
            </div>
          )}
        </section>

        {/* ── RIGHT: Code Editor + Input/Output ── */}
        <section className="problem-right-panel">

          {/* Editor top bar */}
          <div className="problem-editor-topbar">
            <span className="editor-topbar-title">
              <FiTerminal size={13} /> Solution
            </span>
            <div className="editor-topbar-right">
              <div className="lang-select-wrap">
                <LanguageSelector language={language} setLanguage={handleLanguageChange} />
              </div>
            </div>
          </div>

          {/* Code editor */}
          <div className="problem-editor-body">
            <CodeEditor
              code={code}
              setCode={setCode}
              language={language}
              settings={DEFAULT_SETTINGS}
            />
          </div>

          {/* ── I/O Panel ── */}
          <div className={`problem-io-panel ${ioPanelOpen ? 'open' : 'collapsed'}`}>
            {/* I/O Header */}
            <div className="io-panel-header" onClick={() => setIoPanelOpen(!ioPanelOpen)}>
              <div className="io-tabs">
                <button
                  type="button"
                  className={`io-tab ${activeIOTab === 'input' ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setActiveIOTab('input'); setIoPanelOpen(true); }}
                >
                  Custom Input
                </button>
                <button
                  type="button"
                  className={`io-tab ${activeIOTab === 'output' ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setActiveIOTab('output'); setIoPanelOpen(true); }}
                >
                  Output
                  {runStatus && (
                    <span className="io-status-dot" style={{ background: statusColor }} />
                  )}
                </button>
              </div>

              <div className="io-header-actions">
                {/* Sample quick-fill buttons */}
                {samples.length > 0 && activeIOTab === 'input' && (
                  <div className="sample-btns">
                    {samples.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="sample-fill-btn"
                        onClick={(e) => { e.stopPropagation(); handleUseSample(s.input); }}
                        title={`Điền Sample ${i + 1}`}
                      >
                        Sample {i + 1}
                      </button>
                    ))}
                  </div>
                )}

                {activeIOTab === 'output' && output && (
                  <button
                    type="button"
                    className="io-copy-btn"
                    onClick={(e) => { e.stopPropagation(); handleCopyOutput(); }}
                    title="Copy output"
                  >
                    <FiCopy size={12} />
                  </button>
                )}

                <button
                  type="button"
                  className="io-toggle-btn"
                  onClick={(e) => { e.stopPropagation(); setIoPanelOpen(!ioPanelOpen); }}
                >
                  {ioPanelOpen ? <FiChevronDown size={14} /> : <FiChevronUp size={14} />}
                </button>
              </div>
            </div>

            {/* I/O Body */}
            {ioPanelOpen && (
              <div className="io-panel-body">
                {activeIOTab === 'input' ? (
                  <textarea
                    className="io-textarea"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Nhập dữ liệu đầu vào (stdin) tại đây...&#10;Ví dụ:&#10;5&#10;1 2 3 4 5"
                    spellCheck={false}
                  />
                ) : (
                  <div className="io-output-area">
                    {running ? (
                      <div className="io-running">
                        <div className="problem-loading-spinner small" />
                        <span>Đang chạy...</span>
                      </div>
                    ) : output ? (
                      <>
                        {runStatus && (
                          <div className="io-status-bar" style={{ borderColor: statusColor }}>
                            {runStatus.id === 3 ? <FiCheckCircle size={13} /> : <FiXCircle size={13} />}
                            <span style={{ color: statusColor }}>{runStatus.description}</span>
                          </div>
                        )}
                        <pre className="io-output-pre">{output}</pre>
                      </>
                    ) : (
                      <div className="io-placeholder">
                        Nhấn <strong>▶ Run</strong> để chạy code với custom input
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom action bar */}
          <div className="problem-bottom-bar">
            <button
              type="button"
              className="run-code-btn"
              onClick={handleRunCode}
              disabled={running}
            >
              {running ? (
                <><div className="problem-loading-spinner tiny" /> Đang chạy...</>
              ) : (
                <><FiPlay size={13} /> Run</>
              )}
            </button>
            <button type="button" className="submit-btn" onClick={handleSubmit}>
              <FiSend size={13} /> Submit
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProblemPage;

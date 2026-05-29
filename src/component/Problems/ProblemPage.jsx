import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPlay, FiSend, FiExternalLink } from 'react-icons/fi';
import CodeEditor from '../Editor/CodeEditor';
import LanguageSelector from '../Header/LanguageSelector';
import PresenceBar from '../PresenceBar/PresenceBar';
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

const ProblemPage = () => {
  const { contestId, index } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('C++');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');

  const problemUrl = useMemo(() => (problem ? buildProblemUrl(problem) : ''), [problem]);

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

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    if (problem) setCode(buildStarterCode(problem, nextLanguage));
  };

  const openRoom = () => {
    if (!problem) return;
    navigate(getProblemRoomPath(problem));
  };

  const handleSubmit = () => {
    if (!problem) return;
    writeProblemStatus(problem.id, 'attempted');
    window.alert('Submit judging sẽ được nối ở phase tiếp theo.');
  };

  if (loading) {
    return <div className="problem-page-loading">Đang tải bài...</div>;
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
      <header className="problem-page-header">
        <button type="button" onClick={() => navigate('/problems')} className="problem-back-btn">
          <FiArrowLeft size={14} /> Problems
        </button>
        <div className="problem-title-block">
          <h1>{problem.name}</h1>
          <div className="problem-title-meta">
            <span className={`difficulty-badge ${getDifficultyClass(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
            {problem.tags.slice(0, 5).map((tag) => <span key={tag} className="problem-tag-pill">{tag}</span>)}
          </div>
        </div>
      </header>

      <div className="problem-presence-row">
        <PresenceBar activeRoom={problem.activeRoom} onOpenRoom={openRoom} />
      </div>

      {warning && <div className="problems-warning">{warning}</div>}

      <div className="problem-workspace">
        <section className="problem-statement">
          <div className="problem-external-card">
            <div className="card-globe-icon">🌐</div>
            <h2>Đề bài Codeforces</h2>
            <p className="card-desc">
              Do chính sách bảo mật của Codeforces (X-Frame-Options), đề bài không thể hiển thị trực tiếp trong khung này. Vui lòng nhấn nút dưới đây để xem chi tiết.
            </p>
            <div className="problem-meta-box">
              <div className="meta-row">
                <span className="meta-label">Bài tập:</span>
                <span className="meta-val">{problem.contestId}{problem.index} - {problem.name}</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Độ khó:</span>
                <span className={`difficulty-badge ${getDifficultyClass(problem.difficulty)}`}>
                  {problem.difficulty} {problem.rating ? `(${problem.rating})` : ''}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Đã giải:</span>
                <span className="meta-val">{problem.solvedCount.toLocaleString()} người</span>
              </div>
              <div className="meta-row">
                <span className="meta-label">Tags:</span>
                <div className="meta-tags">
                  {problem.tags.map((tag) => <span key={tag} className="tag-badge">{tag}</span>)}
                </div>
              </div>
            </div>
            <a
              href={problemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="open-external-btn"
            >
              <FiExternalLink size={14} /> Mở đề bài ở tab mới
            </a>
          </div>
        </section>

        <section className="problem-editor-panel">
          <div className="problem-editor-topbar">
            <span>Solution</span>
            <div className="lang-select-wrap">
              <LanguageSelector language={language} setLanguage={handleLanguageChange} />
            </div>
          </div>
          <div className="problem-editor-body">
            <CodeEditor
              code={code}
              setCode={setCode}
              language={language}
              settings={DEFAULT_SETTINGS}
            />
          </div>
          <div className="problem-bottom-bar">
            <button type="button" className="run-sample-btn" disabled title="Coming soon">
              <FiPlay size={13} /> Run sample
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

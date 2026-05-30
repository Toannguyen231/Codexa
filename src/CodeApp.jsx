import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import './App.css';
import './component/Problems/Problems.scss';

import Header from './component/Header/Header';
import Sidebar from './component/Sidebar/Sidebar';
import CodeEditor from './component/Editor/CodeEditor';
import OutputPanel from './component/OutputPanel/OutputPanel';
import HistoryPanel from './component/History/HistoryPanel';
import AIPanel from './component/AIPanel/AIPanel';
import { useRoomManager } from './hooks/useRoomManager';
import { API_URL, extractSamples } from './component/Problems/problemUtils';

/**
 * Component: CodeApp
 * Giao diện chính của phòng lập trình cộng tác thời gian thực.
 * Tách biệt hoàn toàn phần xử lý logic nghiệp vụ ra hook `useRoomManager`.
 */
function CodeApp() {
    // Lấy roomId từ URL params: /room/:id
    const { id: roomId } = useParams();
    const [searchParams] = useSearchParams();
    const problemId = searchParams.get('problem') || (roomId?.startsWith('CF-') ? roomId.substring(3) : '');

    // Lấy JWT token từ localStorage
    const [token] = useState(() => localStorage.getItem('token') || '');

    const [problem, setProblem] = useState(null);
    const [problemLoading, setProblemLoading] = useState(false);
    const [samples, setSamples] = useState([]);
    const [testResults, setTestResults] = useState(null);
    const [runningTests, setRunningTests] = useState(false);

    const parseProblemId = (id) => {
        if (!id) return null;
        const parts = id.split('-');
        if (parts.length < 2) return null;
        return { contestId: parts[0], index: parts[1] };
    };

    useEffect(() => {
        if (!problemId) {
            setProblem(null);
            return;
        }

        const parsed = parseProblemId(problemId);
        if (!parsed) return;

        let cancelled = false;
        setProblemLoading(true);

        const fetchProblem = async () => {
            try {
                const res = await fetch(`${API_URL}/problems/${parsed.contestId}/${parsed.index}`);
                const data = await res.json();
                if (cancelled || !res.ok) return;
                setProblem(data.problem);
                
                if (data.problem?.statementHtml) {
                    const extracted = extractSamples(data.problem.statementHtml);
                    const hidden = data.problem.hiddenTestcases || [];
                    const maskedHidden = hidden.map((tc) => ({
                        input: tc.isHidden ? '*** HIDDEN ***' : tc.input,
                        output: tc.isHidden ? '*** HIDDEN ***' : tc.output,
                        isHidden: tc.isHidden,
                        realInput: tc.input,
                        realOutput: tc.output,
                    }));
                    setSamples([...extracted, ...maskedHidden]);
                }
            } catch (err) {
                console.error("Failed to load problem statement in room:", err);
            } finally {
                setProblemLoading(false);
            }
        };

        fetchProblem();
        return () => {
            cancelled = true;
        };
    }, [problemId]);

    // Typeset MathJax when problem statement loads
    useEffect(() => {
        if (!problem?.statementHtml) return;

        if (!window.MathJax) {
            window.MathJax = {
                tex: {
                    inlineMath: [['$$$', '$$$'], ['\\(', '\\)']],
                    displayMath: [['$$$$$', '$$$$$'], ['\\[', '\\]']],
                },
                options: {
                    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                },
            };
        }

        const scriptId = 'mathjax-script';
        let script = document.getElementById(scriptId);

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
            script.async = true;
            script.onload = () => {
                if (window.MathJax && window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise().catch((err) => console.error(err));
                }
            };
            document.head.appendChild(script);
        } else {
            const timer = setTimeout(() => {
                if (window.MathJax && window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise().catch((err) => console.error(err));
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [problem?.statementHtml]);

    // Đóng gói logic nghiệp vụ trong custom hook
    const {
        currentUser,
        language,
        code,
        output,
        isRunning,
        stdin,
        setStdin,
        roomOwner,
        roomParticipants,
        socket,
        onlineUsers,
        isConnected,
        connectionStatus,
        handleCodeChange,
        handleLanguageChange,
        handleRunCode,
        handleRestore,
    } = useRoomManager(roomId, token, problemId);

    // Trạng thái hiển thị Modals/Panels
    const [showHistory, setShowHistory] = useState(false);
    const [aiOpen, setAIOpen] = useState(false);
    
    // Cài đặt trình soạn thảo (Editor settings)
    const [editorSettings, setEditorSettings] = useState({
        theme: 'vs-dark',
        fontSize: 14,
        minimap: false,
        wordWrap: 'on'
    });

    // ── Run All Tests ──────────────────────────────────────────────────
    const handleRunAllTests = async () => {
        if (runningTests || isRunning || !code.trim() || samples.length === 0) return;
        setRunningTests(true);
        
        const initialResults = samples.map(s => ({
            ...s,
            actualOutput: null,
            status: 'Pending',
        }));
        setTestResults(initialResults);

        try {
            for (let i = 0; i < samples.length; i++) {
                setTestResults(prev => {
                    const newArr = [...prev];
                    newArr[i].status = 'Running';
                    return newArr;
                });

                const res = await fetch(`${API_URL}/code/execute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        language,
                        code,
                        stdin: samples[i].isHidden ? samples[i].realInput : samples[i].input,
                    }),
                });

                const result = await res.json();

                let status = 'Error';
                let actualOutput = '';

                if (!res.ok) {
                    actualOutput = result.message || 'Lỗi server.';
                } else if (result.compile_output) {
                    actualOutput = result.compile_output;
                    status = 'Compile Error';
                } else {
                    const rawStdout = result.stdout || '';
                    const rawStderr = result.stderr ? `\n--- stderr ---\n${result.stderr}` : '';
                    actualOutput = rawStdout + rawStderr;
                    
                    const expectedRaw = samples[i].isHidden ? samples[i].realOutput : samples[i].output;
                    const expected = (expectedRaw || '').trim();
                    const actual = rawStdout.trim();
                    
                    status = (actual === expected) ? 'Passed' : 'Failed';
                    if (result.status?.id !== 3 && status !== 'Passed') {
                        status = 'Runtime Error';
                    }
                }

                setTestResults(prev => {
                    const newArr = [...prev];
                    newArr[i].status = status;
                    newArr[i].actualOutput = actualOutput;
                    return newArr;
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRunningTests(false);
        }
    };

    // ── Resizer Logic ──────────────────────────────────────────────────
    const [leftWidth, setLeftWidth] = useState(500); // 500px default

    const handleMouseDown = (e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = leftWidth;

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startX;
            let newWidth = startWidth + deltaX;
            if (newWidth < 200) newWidth = 200;
            if (newWidth > window.innerWidth - 300) newWidth = window.innerWidth - 300;
            setLeftWidth(newWidth);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    return (
        <div className="app-shell">
            {/* ── Lịch sử Code (Modal) ── */}
            {showHistory && (
                <HistoryPanel
                    roomId={roomId}
                    token={token}
                    onRestore={handleRestore}
                    onClose={() => setShowHistory(false)}
                    socket={socket}
                    isConnected={isConnected}
                    currentCode={code}
                    currentLanguage={language}
                    currentUser={currentUser}
                />
            )}

            {/* ── Giao diện Header (Thanh công cụ) ── */}
            <Header
                roomId={roomId}
                language={language}
                setLanguage={handleLanguageChange}
                onRun={handleRunCode}
                isRunning={isRunning}
                isConnected={isConnected}
                onlineUsers={onlineUsers}
                currentUser={currentUser}
                onOpenHistory={() => setShowHistory(true)}
                editorSettings={editorSettings}
                setEditorSettings={setEditorSettings}
                aiOpen={aiOpen}
                setAIOpen={setAIOpen}
            />

            {/* ── Nội dung chính: Sidebar + Editor + Output ── */}
            <div className="app-main">
                <Sidebar
                    onlineUsers={onlineUsers}
                    currentUser={currentUser}
                    roomId={roomId}
                    socket={socket}
                    isConnected={isConnected}
                    roomOwner={roomOwner}
                    roomParticipants={roomParticipants}
                />

                {problemId && (
                    <>
                        <section className="room-problem-statement-panel" style={{ width: leftWidth, flexShrink: 0 }}>
                            {problemLoading ? (
                            <div className="room-problem-loading">
                                <div className="problem-loading-spinner small" />
                                <span>Đang tải đề bài...</span>
                            </div>
                        ) : problem?.statementHtml ? (
                            <div
                                className="problem-scraped-content"
                                dangerouslySetInnerHTML={{ __html: problem.statementHtml }}
                            />
                        ) : (
                            <div className="room-problem-error">
                                <span>Không thể tải đề bài.</span>
                            </div>
                        )}
                        </section>
                        {/* Resizer */}
                        <div className="panel-resizer" onMouseDown={handleMouseDown} />
                    </>
                )}

                <div className="editor-area">
                    <CodeEditor
                        code={code}
                        setCode={handleCodeChange}
                        language={language}
                        socket={socket}
                        roomId={roomId}
                        currentUser={currentUser}
                        settings={editorSettings}
                        connectionStatus={connectionStatus}
                    />

                    {/* ── Bảng hiển thị kết quả Console ── */}
                    <OutputPanel
                        output={output}
                        isRunning={isRunning}
                        onClear={() => {}} // Hook quản lý output, panel chỉ cần hiện
                        stdin={stdin}
                        setStdin={setStdin}
                        samples={samples}
                        testResults={testResults}
                        runningTests={runningTests}
                        onRunAllTests={handleRunAllTests}
                    />
                </div>
            </div>

            {/* ── Trợ lý ảo AI (Sidebar phụ) ── */}
            {aiOpen && (
                <AIPanel
                    code={code}
                    language={language}
                    onClose={() => setAIOpen(false)}
                />
            )}
        </div>
    );
}

export default CodeApp;

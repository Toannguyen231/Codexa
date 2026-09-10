import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiCode, FiUsers, FiZap, FiCpu, FiEye, FiEyeOff, FiCheck, FiX, FiChevronRight, FiGithub, FiTerminal, FiExternalLink } from 'react-icons/fi';
import { SiCodeforces } from 'react-icons/si';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const parseJsonResponse = async (res) => {
  const text = await res.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Server trả về dữ liệu không hợp lệ (HTTP ${res.status}).`);
  }
};

// ─── Animated Particles ───
// Pt (particle) class — defined OUTSIDE the component/effect so React's
// react-hooks/unsupported-syntax rule can parse it (inline class in a hook
// is not supported). It only reads `ctx` passed in at construction time,
// so hoisting it out does not change any animation behavior.
class Pt {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.reset();
  }
  reset() {
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    this.sz = 1 + Math.random() * 2;
    this.sx = (Math.random() - 0.5) * 0.3;
    this.sy = (Math.random() - 0.5) * 0.3;
    this.o = 0.15 + Math.random() * 0.2;
    this.c = Math.random() > 0.5 ? [16, 185, 129] : [139, 92, 246];
  }
  update() {
    this.x += this.sx;
    this.y += this.sy;
    if (this.x < 0 || this.x > this.canvas.width) this.sx *= -1;
    if (this.y < 0 || this.y > this.canvas.height) this.sy *= -1;
  }
  draw() {
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.sz, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(${this.c[0]},${this.c[1]},${this.c[2]},${this.o})`;
    this.ctx.fill();
  }
}

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const count = 50;
    let particles = [];
    let animId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) particles.push(new Pt(ctx, canvas));

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => { p.update(); p.draw(); });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const op = (1 - dist / 120) * 0.08;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(16,185,129,${op})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="login-particles-canvas" />;
}

// ─── Floating decoration shapes ───
function FloatingOrbs() {
  return (
    <div className="login-orbs" aria-hidden="true">
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />
      <div className="login-orb login-orb--3" />
    </div>
  );
}

function GridBg() {
  return <div className="login-grid-bg" aria-hidden="true" />;
}

// ─── Code decor lines ───
const codeDecorLines = [
  { indent: 0, text: 'import { Collaboration } from "coderoom";', color: '#34d399' },
  { indent: 0, text: 'import { AI, Battle } from "features";', color: '#34d399' },
  { indent: 0, text: '', color: 'transparent' },
  { indent: 0, text: 'const room = new Room("codexa-2026");', color: '#c084fc' },
  { indent: 1, text: 'room.join(session);', color: '#e2e8f0' },
  { indent: 1, text: 'room.sync({ realtime: true });', color: '#e2e8f0' },
  { indent: 0, text: '', color: 'transparent' },
  { indent: 0, text: 'const result = await AI.suggest({', color: '#f59e0b' },
  { indent: 1, text: 'code: editor.getValue(),', color: '#f59e0b' },
  { indent: 1, text: 'context: "optimize runtime",', color: '#f59e0b' },
  { indent: 0, text: '});', color: '#f59e0b' },
  { indent: 0, text: '', color: 'transparent' },
  { indent: 0, text: '// Ready to ship 🚀', color: '#64748b' },
];

function CodeDecor() {
  return (
    <div className="login-code-decor" aria-hidden="true">
      <div className="login-code-decor-dots">
        <span /><span /><span />
      </div>
      <pre className="login-code-decor-lines">
        {codeDecorLines.map((line, i) => (
          <code key={i} style={{ color: line.color }}>
            {'  '.repeat(line.indent)}{line.text || ' '}
          </code>
        ))}
      </pre>
    </div>
  );
}

// ─── Password strength indicator ───
function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { label: ' 6 ký tự', pass: password.length >= 6 },
    { label: 'Có chữ hoa', pass: /[A-Z]/.test(password) },
    { label: 'Có chữ thường', pass: /[a-z]/.test(password) },
    { label: 'Có số', pass: /\d/.test(password) },
    { label: 'Có ký tự đặc biệt', pass: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  const score = checks.filter((c) => c.pass).length;
  const barColor =
    score <= 1 ? '#ef4444' : score <= 3 ? '#f59e0b' : score <= 4 ? '#34d399' : '#34d399';

  return (
    <div className="login-password-strength">
      <div className="login-password-strength-bar">
        <div className="login-password-strength-fill" style={{ width: `${(score / 5) * 100}%`, background: barColor }} />
      </div>
      <div className="login-password-strength-checks">
        {checks.map((check, i) => (
          <span key={i} className={`login-password-check ${check.pass ? 'pass' : 'fail'}`}>
            {check.pass ? <FiCheck size={10} /> : <FiX size={10} />} {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Login Component ───
const Login = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const formRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      const input = formRef.current?.querySelector('input:not([type="hidden"])');
      input?.focus();
    }, 100);
  }, [isRegister]);

  // Helper: get token from response (handle both `token` and `accessToken`)
  const extractToken = (data) => data.accessToken || data.token;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? { username, email, password }
        : { email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // sends cookies (refresh token)
        body: JSON.stringify(body),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        setError(data.message || `Có lỗi xảy ra (HTTP ${res.status}).`);
        setLoading(false);
        return;
      }

      // Lưu access token
      const token = extractToken(data);
      localStorage.setItem('token', token);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.removeItem('coderoom.problemStatuses');

      // Nếu đăng ký thành công, hiển thị message verify email
      if (isRegister) {
        setSuccessMsg(data.message || 'Đăng ký thành công!');
        setLoading(false);
        return;
      }

      navigate('/rooms');
    } catch (err) {
      setError('Không thể kết nối server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccessMsg('');
  };

  // ── Render ──
  return (
    <section className="login-page">
      <GridBg />
      <FloatingOrbs />
      <ParticleCanvas />

      <div className="login-layout">
        {/* LEFT: Branding */}
        <div className="login-branding">
          <div className="login-branding-sticky">
            <div className="login-branding-header">
              <div className="login-logo-mark">
                <FiTerminal size={22} />
              </div>
              <h1 className="login-logo-text">
                Code<span>Room</span>
              </h1>
            </div>

            <p className="login-tagline">
              Nền tảng lập trình cộng tác <br />
              <strong>thời gian thực</strong> dành cho developers.
            </p>

            <div className="login-feature-pills">
              <span className="pill"><FiCode size={12} /> Editor đồng cấp</span>
              <span className="pill"><FiUsers size={12} /> Code cùng nhau</span>
              <span className="pill"><FiZap size={12} /> 7+ ngôn ngữ</span>
              <span className="pill"><FiCpu size={12} /> AI Assistant</span>
              <span className="pill"><FiTerminal size={12} /> PvP Battle</span>
              <span className="pill"><SiCodeforces size={11} /> Codeforces</span>
            </div>

            <CodeDecor />

            <div className="login-stats">
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Bài tập</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Lượt code</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">#1</span>
                <span className="stat-label">Coding Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Form */}
        <div className="login-form-area">
          <div className="login-card">
            {/* Tabs */}
            <div className="login-tabs">
              <button
                className={`login-tab ${!isRegister ? 'active' : ''}`}
                onClick={() => !isRegister || switchMode()}
                type="button"
              >
                Đăng nhập
              </button>
              <button
                className={`login-tab ${isRegister ? 'active' : ''}`}
                onClick={() => isRegister || switchMode()}
                type="button"
              >
                Đăng ký
              </button>
              <div className={`login-tab-indicator ${isRegister ? 'right' : 'left'}`} />
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="login-form" noValidate>
              {error && (
                <div className="login-message login-message--error">
                  <FiX size={14} />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="login-message login-message--success">
                  <FiCheck size={14} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className={`login-field ${isRegister ? 'field-visible' : 'field-hidden'}`}>
                <label htmlFor="username">Tên hiển thị</label>
                <div className="login-input-wrap">
                  <FiUser className="login-input-icon" size={16} />
                  <input
                    id="username"
                    type="text"
                    placeholder="your_name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required={isRegister}
                    autoComplete="username"
                    disabled={!isRegister}
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="email">Email</label>
                <div className="login-input-wrap">
                  <FiMail className="login-input-icon" size={16} />
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="password">Mật khẩu</label>
                <div className="login-input-wrap">
                  <FiLock className="login-input-icon" size={16} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isRegister ? 'Tạo mật khẩu mạnh' : '••••••••'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {isRegister && <PasswordStrength password={password} />}

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? (
                  <span className="login-submit-loading">
                    <span className="spinner" />
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="login-submit-text">
                    {isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}
                    <FiChevronRight size={18} />
                  </span>
                )}
              </button>

              <div className="login-social-divider">
                <span>hoặc tiếp tục với</span>
              </div>
              <div className="login-social-buttons">
                <button type="button" className="login-social-btn" disabled>
                  <FiGithub size={18} /> GitHub
                </button>
                <button type="button" className="login-social-btn" disabled>
                  <FiExternalLink size={18} /> Google
                </button>
              </div>
              <p className="login-social-note">Sắp ra mắt • Đang phát triển</p>

              {isRegister && successMsg && (
                <p className="login-verify-note" style={{
                  marginTop: 16, padding: 12, background: 'rgba(99,102,241,0.1)',
                  borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)',
                  color: '#a5b4fc', fontSize: 13, textAlign: 'center',
                }}>
                  <FiMail size={13} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Kiểm tra email của bạn để xác thực tài khoản.
                </p>
              )}
            </form>

            <p className="login-footer-text">
              Bằng việc tiếp tục, bạn đồng ý với{' '}
              <a href="#terms">Điều khoản dịch vụ</a> và{' '}
              <a href="#privacy">Chính sách bảo mật</a> của chúng tôi.
            </p>
          </div>

          <button className="login-back-link" onClick={() => navigate('/')} type="button">
            ← Quay lại trang chủ
          </button>
        </div>
      </div>
    </section>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiCode, FiUsers, FiZap, FiCpu } from 'react-icons/fi';
import { LiaAccessibleIcon } from 'react-icons/lia';
import './Login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const Login = () => {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const body = isRegister
                ? { username, email, password }
                : { email, password };

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Có lỗi xảy ra.');
                setLoading(false);
                return;
            }

            // Lưu JWT token vào localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Chuyển đến trang Room Menu
            navigate('/rooms');
        } catch (err) {
            console.error('Login error:', err);
            setError('Không thể kết nối server: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="login-page-wrapper">
            <div className="login-container">
                {/* ── Left: Branding ── */}
                <div className="login-brand">
                    <div className="login-brand-logo">
                        <LiaAccessibleIcon size={36} color="#fff" />
                    </div>
                    <h1>CodeRoom</h1>
                    <p>Nền tảng lập trình cộng tác thời gian thực — code cùng nhau, mọi lúc mọi nơi.</p>

                    <div className="login-brand-features">
                        <div className="login-feature-item">
                            <div className="login-feature-icon"><FiCode size={15} /></div>
                            <span>Monaco Editor — engine giống VS Code</span>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon"><FiUsers size={15} /></div>
                            <span>Real-time sync — code cùng nhiều người</span>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon"><FiZap size={15} /></div>
                            <span>Chạy code 7 ngôn ngữ trực tiếp</span>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon"><FiCpu size={15} /></div>
                            <span>AI Assistant — Gemini 2.5 Flash</span>
                        </div>
                    </div>
                </div>

                {/* ── Right: Form ── */}
                <div className="login-form-panel">
                    <h2 className="login-form-title">
                        {isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}
                    </h2>
                    <p className="login-form-subtitle">
                        {isRegister
                            ? 'Đăng ký để bắt đầu lập trình cùng bạn bè'
                            : 'Đăng nhập để tiếp tục coding session'}
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Error */}
                        {error && (
                            <div className="login-error">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Username (Register only) */}
                        {isRegister && (
                            <div className="login-field">
                                <label htmlFor="username">Username</label>
                                <div className="login-input-wrap">
                                    <input
                                        type="text"
                                        id="username"
                                        placeholder="Nhập tên hiển thị"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoComplete="username"
                                    />
                                    <FiUser size={16} />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="login-field">
                            <label htmlFor="email">Email</label>
                            <div className="login-input-wrap">
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                                <FiMail size={16} />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="login-field">
                            <label htmlFor="password">Mật khẩu</label>
                            <div className="login-input-wrap">
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                                />
                                <FiLock size={16} />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="login-submit"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : (isRegister ? 'Đăng ký' : 'Đăng nhập')}
                        </button>

                        {/* Toggle */}
                        <div className="login-toggle">
                            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
                            <a
                                href="#!"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsRegister(!isRegister);
                                    setError('');
                                }}
                            >
                                {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Login;
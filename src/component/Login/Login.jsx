import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiLinkedin, FiGithub } from 'react-icons/fi';
import trollImage from './img/Anhrtroll.png';
import './Login.css';

const API_URL = 'http://localhost:3001/api';

const Login = () => {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [roomId, setRoomId] = useState('');
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

            // Nếu có roomId → join phòng đó, nếu không → tạo phòng mới
            console.log('RoomId input:', roomId);
            if (roomId.trim()) {
                console.log('Navigating to existing room:', roomId.trim());
                navigate(`/room/${roomId.trim()}`);
            } else {
                console.log('Creating new room...');
                // Tạo phòng mới
                const roomRes = await fetch(`${API_URL}/rooms`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${data.token}`,
                    },
                });
                console.log('Room API response status:', roomRes.status);
                const roomData = await roomRes.json();
                console.log('Room API response data:', roomData);
                if (roomData.room) {
                    console.log('Navigating to new room:', roomData.room.roomId);
                    navigate(`/room/${roomData.room.roomId}`);
                } else {
                    console.log('Room creation failed, using DEFAULT');
                    navigate('/room/DEFAULT');
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Không thể kết nối server: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="vh-100 login-page-wrapper">
            <div className="container-fluid h-custom">
                <div className="row d-flex justify-content-center align-items-center h-100" style={{ marginTop: '38px' }}>
                    <div className="col-md-9 col-lg-6 col-xl-5">
                        <img
                            src={trollImage}
                            className="img-fluid"
                            alt="Sample image"
                        />
                    </div>
                    <div className="col-md-8 col-lg-6 col-xl-4 offset-xl-1">
                        <form onSubmit={handleSubmit}>
                            <div className="d-flex flex-row align-items-center justify-content-center justify-content-lg-start">
                                <p className="lead fw-normal mb-0 me-3" style={{ color: 'var(--text-primary)' }}>Sign in with</p>
                                <button type="button" className="btn btn-primary btn-floating mx-1" style={{ borderRadius: '50%', padding: '10px 15px' }}>
                                    <FiFacebook />
                                </button>
                                <button type="button" className="btn btn-primary btn-floating mx-1" style={{ borderRadius: '50%', padding: '10px 15px' }}>
                                    <FiTwitter />
                                </button>
                                <button type="button" className="btn btn-primary btn-floating mx-1" style={{ borderRadius: '50%', padding: '10px 15px' }}>
                                    <FiLinkedin />
                                </button>
                            </div>

                            <div className="divider d-flex align-items-center my-4">
                                <p className="text-center fw-bold mx-3 mb-0" style={{ color: 'var(--text-muted)' }}>Or</p>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div style={{ color: '#f44336', fontSize: '13px', marginBottom: '12px', padding: '8px 12px', background: 'rgba(244,67,54,0.1)', borderRadius: '6px' }}>
                                    {error}
                                </div>
                            )}

                            {/* Username (chỉ hiện khi Register) */}
                            {isRegister && (
                                <div className="form-outline mb-4">
                                    <input
                                        type="text"
                                        id="username"
                                        className="form-control form-control-lg"
                                        placeholder="Enter username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                    />
                                    <label className="form-label" htmlFor="username" style={{ color: 'var(--text-muted)' }}>Username</label>
                                </div>
                            )}

                            {/* Email input */}
                            <div className="form-outline mb-4">
                                <input
                                    type="email"
                                    id="email"
                                    className="form-control form-control-lg"
                                    placeholder="Enter a valid email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <label className="form-label" htmlFor="email" style={{ color: 'var(--text-muted)' }}>Email address</label>
                            </div>

                            {/* Password input */}
                            <div className="form-outline mb-3">
                                <input
                                    type="password"
                                    id="password"
                                    className="form-control form-control-lg"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <label className="form-label" htmlFor="password" style={{ color: 'var(--text-muted)' }}>Password</label>
                            </div>

                            {/* Room ID input (tùy chọn) */}
                            <div className="form-outline mb-3">
                                <input
                                    type="text"
                                    id="roomId"
                                    className="form-control form-control-lg"
                                    placeholder="Enter Room ID to join (optional)"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                />
                                <label className="form-label" htmlFor="roomId" style={{ color: 'var(--text-muted)' }}>Room ID (để trống = tạo phòng mới)</label>
                            </div>

                            <div className="text-center text-lg-start mt-4 pt-2">
                                <button type="submit" className="btn btn-primary btn-lg" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', backgroundColor: '#06b6d4', borderColor: '#06b6d4' }} disabled={loading}>
                                    {loading ? 'Loading...' : (isRegister ? 'Register' : 'Login')}
                                </button>
                                <p className="small fw-bold mt-2 pt-1 mb-0" style={{ color: 'var(--text-primary)' }}>
                                    {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                                    <a href="#!" className="link-danger" style={{ color: '#06b6d4' }} onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); setError(''); }}>
                                        {isRegister ? 'Login' : 'Register'}
                                    </a>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section >
    );
};

export default Login;
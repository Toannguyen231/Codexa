import React, { useState, useEffect } from 'react';
import './Leaderboard.scss';
import API from '../../api';

const RANK_COLORS = {
    'Sắt': '#A0AEC0',           // Gray
    'Đồng': '#B45309',          // Orange
    'Bạc': '#BFDBFE',           // Light Blue
    'Vàng': '#FCD34D',          // Yellow
    'Tinh Anh': '#A78BFA',      // Purple
    'Kim Cương': '#06B6D4',     // Cyan
    'Thách Đấu': '#FF6B6B'      // Red
};

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('points'); // points, problems, easyProblems
    const [filterRank, setFilterRank] = useState('');
    const [rankStats, setRankStats] = useState({});

    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        fetchLeaderboard();
        fetchRankStats();
    }, [page, sortBy]);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await API.get('/leaderboard', {
                params: {
                    page,
                    limit: ITEMS_PER_PAGE
                }
            });

            if (response.data.success) {
                setLeaderboard(response.data.leaderboard);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUserRank = async () => {
        try {
            const response = await API.get('/leaderboard/me/stats');
            if (response.data.success) {
                setCurrentUserRank(response.data.user);
            }
        } catch (error) {
            console.error('Error fetching current user rank:', error);
        }
    };

    const fetchRankStats = async () => {
        try {
            const response = await API.get('/leaderboard/stats/ranks');
            if (response.data.success) {
                setRankStats(response.data.rankStats);
            }
        } catch (error) {
            console.error('Error fetching rank stats:', error);
        }
    };

    const getRankIcon = (rank) => {
        const icons = {
            'Sắt': '⚔️',
            'Đồng': '🥉',
            'Bạc': '🥈',
            'Vàng': '🥇',
            'Tinh Anh': '💜',
            'Kim Cương': '💎',
            'Thách Đấu': '👑'
        };
        return icons[rank] || '⭐';
    };

    const formatPoints = (points) => {
        return points.toLocaleString();
    };

    if (loading && leaderboard.length === 0) {
        return (
            <div className="leaderboard-container">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Đang tải bảng xếp hạng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-container">
            {/* Header */}
            <div className="leaderboard-header">
                <h1>🏆 Bảng Xếp Hạng Toàn Cầu</h1>
                <p>Cạnh tranh với cộng đồng lập trình viên trên toàn thế giới</p>
            </div>

            {/* Current User Card */}
            {currentUserRank && (
                <div className="current-user-card">
                    <div className="user-avatar">
                        <img src={currentUserRank.avatar || '/default-avatar.png'} alt={currentUserRank.username} />
                    </div>
                    <div className="user-info">
                        <h2>{currentUserRank.username}</h2>
                        <div className="rank-badge" style={{ backgroundColor: RANK_COLORS[currentUserRank.rank] }}>
                            {getRankIcon(currentUserRank.rank)} {currentUserRank.rank}
                        </div>
                    </div>
                    <div className="user-stats">
                        <div className="stat">
                            <span className="label">Vị Trí</span>
                            <span className="value">#{currentUserRank.rankPosition}</span>
                        </div>
                        <div className="stat">
                            <span className="label">Điểm</span>
                            <span className="value">{formatPoints(currentUserRank.totalPoints)}</span>
                        </div>
                        <div className="stat">
                            <span className="label">Bài Giải</span>
                            <span className="value">{currentUserRank.problemsSolved}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Rank Distribution */}
            <div className="rank-distribution">
                <h3>📊 Phân Bố Rank</h3>
                <div className="rank-stats">
                    {Object.entries(rankStats).map(([rank, count]) => (
                        <div key={rank} className="rank-stat-item">
                            <div className="rank-dot" style={{ backgroundColor: RANK_COLORS[rank] }}></div>
                            <span className="rank-name">{rank}</span>
                            <span className="rank-count">{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="leaderboard-table-wrapper">
                <table className="leaderboard-table">
                    <thead>
                        <tr>
                            <th className="rank-col">Xếp Hạng</th>
                            <th className="user-col">Người Dùng</th>
                            <th className="tier-col">Hạng</th>
                            <th className="points-col">Điểm</th>
                            <th className="solved-col">Bài Giải</th>
                            <th className="easy-col">Easy</th>
                            <th className="medium-col">Medium</th>
                            <th className="hard-col">Hard</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((user) => (
                            <tr key={user.userId} className={`leaderboard-row ${user.userId === currentUserRank?.userId ? 'current-user' : ''}`}>
                                <td className="rank-col">
                                    <div className="position-badge">
                                        {user.position <= 3 ? (
                                            <span className="medal">
                                                {user.position === 1 ? '🥇' : user.position === 2 ? '🥈' : '🥉'}
                                            </span>
                                        ) : (
                                            <span>#{user.position}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="user-col">
                                    <div className="user-info-row">
                                        <img src={user.avatar || '/default-avatar.png'} alt={user.username} className="avatar-small" />
                                        <span className="username">{user.username}</span>
                                    </div>
                                </td>
                                <td className="tier-col">
                                    <div
                                        className="rank-badge-small"
                                        style={{ backgroundColor: user.rankColor }}
                                        title={user.rank}
                                    >
                                        {getRankIcon(user.rank)} {user.rank}
                                    </div>
                                </td>
                                <td className="points-col">
                                    <span className="points">{formatPoints(user.totalPoints)}</span>
                                </td>
                                <td className="solved-col">
                                    <span>{user.problemsSolved}</span>
                                </td>
                                <td className="easy-col">
                                    <span className="easy-badge">{user.easyProblems}</span>
                                </td>
                                <td className="medium-col">
                                    <span className="medium-badge">{user.mediumProblems}</span>
                                </td>
                                <td className="hard-col">
                                    <span className="hard-badge">{user.hardProblems}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
                <button
                    className="page-btn"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                >
                    ← Trước
                </button>

                <div className="page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = page > 3 ? page - 2 + i : i + 1;
                        if (pageNum > totalPages) return null;
                        return (
                            <button
                                key={pageNum}
                                className={`page-number ${page === pageNum ? 'active' : ''}`}
                                onClick={() => setPage(pageNum)}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    className="page-btn"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                >
                    Sau →
                </button>

                <span className="page-info">
                    Trang {page} / {totalPages}
                </span>
            </div>

            {/* Legend */}
            <div className="legend">
                <h4>Hướng Dẫn Điểm</h4>
                <div className="legend-items">
                    <div className="legend-item">
                        <span className="icon">🟢</span>
                        <span>Easy: 50 điểm</span>
                    </div>
                    <div className="legend-item">
                        <span className="icon">🟡</span>
                        <span>Medium: 100 điểm</span>
                    </div>
                    <div className="legend-item">
                        <span className="icon">🔴</span>
                        <span>Hard: 200 điểm</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;

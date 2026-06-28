import React from 'react';
import './App.css';
import CodeApp from './CodeApp';
import Login from './component/Login/Login.jsx';
import RoomMenu from './component/RoomMenu/RoomMenu.jsx';
import Profile from './component/Profile/Profile.jsx';
import ProblemListPage from './component/Problems/ProblemListPage.jsx';
import ProblemPage from './component/Problems/ProblemPage.jsx';
import AdminDashboard from './component/Admin/AdminDashboard.jsx';
import BattleHub from './component/Battle/BattleHub.jsx';
import BattleQueue from './component/Battle/BattleQueue.jsx';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="app-shell" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/rooms" element={<RoomMenu />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/problems" element={<ProblemListPage />} />
        <Route path="/problems/:contestId/:index" element={<ProblemPage />} />
        <Route path="/room/:id" element={<CodeApp />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/battle" element={<BattleHub />} />
        <Route path="/battle/queue" element={<BattleQueue />} />
      </Routes>
    </div>
  );
}

export default App;
 
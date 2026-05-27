import React from 'react';
import './App.css';
import CodeApp from './CodeApp';
import Login from './component/Login/Login.jsx';
import RoomMenu from './component/RoomMenu/RoomMenu.jsx';
import Profile from './component/Profile/Profile.jsx';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div className="app-shell" style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/rooms" element={<RoomMenu />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/room/:id" element={<CodeApp />} />
      </Routes>
    </div>
  );
}

export default App;
 
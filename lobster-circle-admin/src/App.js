/**
 * 🦞 龙虾圈后台管理系统
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import PostManagement from './pages/PostManagement';
import ReportManagement from './pages/ReportManagement';
import ConfigManagement from './pages/ConfigManagement';
import SensitiveWordManagement from './pages/SensitiveWordManagement';
import OperationLogs from './pages/OperationLogs';
import FeedbackManagement from './pages/FeedbackManagement';
import VersionManagement from './pages/VersionManagement';
import CheckInStats from './pages/CheckInStats';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import LoginLogs from './pages/LoginLogs';
import ErrorManagement from './pages/ErrorManagement';
import AdminLayout from './components/AdminLayout';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('admin_token', token);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
  };

  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm: theme.defaultAlgorithm }}>
      <Router>
        {isLoggedIn ? (
          <AdminLayout onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/checkin-stats" element={<CheckInStats />} />
              <Route path="/version" element={<VersionManagement />} />
              <Route path="/feedback" element={<FeedbackManagement />} />
              <Route path="/login-logs" element={<LoginLogs />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/posts" element={<PostManagement />} />
              <Route path="/reports" element={<ReportManagement />} />
              <Route path="/config" element={<ConfigManagement />} />
              <Route path="/sensitive-words" element={<SensitiveWordManagement />} />
              <Route path="/logs" element={<OperationLogs />} />
              <Route path="/errors" element={<ErrorManagement />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AdminLayout>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </Router>
    </ConfigProvider>
  );
}

export default App;

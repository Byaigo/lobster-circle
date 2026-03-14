/**
 * 后台管理布局
 */

import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  SettingOutlined,
  SafetyOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BarChartOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  MessageOutlined,
  LoginOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

export default function AdminLayout({ children, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: '数据统计' },
    { key: '/analytics', icon: <BarChartOutlined />, label: '数据分析' },
    { key: '/checkin-stats', icon: <CalendarOutlined />, label: '签到统计' },
    { key: '/login-logs', icon: <LoginOutlined />, label: '登录日志' },
    { key: '/version', icon: <AppstoreOutlined />, label: '版本管理' },
    { key: '/feedback', icon: <MessageOutlined />, label: '用户反馈' },
    { key: '/users', icon: <UserOutlined />, label: '用户管理' },
    { key: '/posts', icon: <FileTextOutlined />, label: '内容审核' },
    { key: '/reports', icon: <WarningOutlined />, label: '举报管理' },
    { key: '/config', icon: <SettingOutlined />, label: '系统配置' },
    { key: '/sensitive-words', icon: <SafetyOutlined />, label: '敏感词管理' },
    { key: '/logs', icon: <FileDoneOutlined />, label: '操作日志' },
    { key: '/errors', icon: <BugOutlined />, label: '错误日志' },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: onLogout
      }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#001529'
        }}>
          <span style={{ fontSize: 24 }}>🦞</span>
          {!collapsed && <span style={{ marginLeft: 10, color: '#fff', fontSize: 16 }}>龙虾圈管理</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <Dropdown menu={userMenu}>
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar icon={<UserOutlined />} />
              <span>管理员</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{
          margin: '24px 16px',
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          minHeight: 280
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}

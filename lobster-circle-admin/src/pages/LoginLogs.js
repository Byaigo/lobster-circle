/**
 * 登录日志管理页面
 */

import React, { useState, useEffect } from 'react';
import { Table, Tag, Card, Statistic, Row, Col, Input, Select, Space, Button } from 'antd';
import {
  LoginOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  SearchOutlined
} from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const deviceMap = {
  mobile: { text: '手机', icon: '📱', color: 'blue' },
  tablet: { text: '平板', icon: '📲', color: 'purple' },
  desktop: { text: '电脑', icon: '💻', color: 'green' },
  unknown: { text: '未知', icon: '❓', color: 'default' },
};

export default function LoginLogs() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterDevice, setFilterDevice] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchIp, setSearchIp] = useState('');

  useEffect(() => {
    loadLoginLogs();
    loadStats();
  }, []);

  const loadLoginLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      let url = `${API_BASE_URL}/login-logs?`;
      if (filterDevice !== 'all') url += `device=${filterDevice}&`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (searchIp) url += `ip=${searchIp}&`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('加载登录日志失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/login-logs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const columns = [
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      render: (user) => (
        <Space>
          <span>{user?.avatar || '😎'}</span>
          <span>{user?.username || '未知用户'}</span>
        </Space>
      ),
    },
    {
      title: '登录时间',
      dataIndex: 'loginAt',
      key: 'loginAt',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.loginAt) - new Date(b.loginAt),
    },
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: '设备',
      dataIndex: 'device',
      key: 'device',
      render: (device) => (
        <Tag color={deviceMap[device]?.color}>
          {deviceMap[device]?.icon} {deviceMap[device]?.text || device}
        </Tag>
      ),
    },
    {
      title: '系统',
      dataIndex: 'userAgent',
      key: 'os',
      render: (ua) => {
        if (/Windows/i.test(ua)) return 'Windows';
        if (/Mac OS/i.test(ua)) return 'macOS';
        if (/Android/i.test(ua)) return 'Android';
        if (/iOS/i.test(ua)) return 'iOS';
        if (/Linux/i.test(ua)) return 'Linux';
        return '未知';
      },
    },
    {
      title: '浏览器',
      dataIndex: 'userAgent',
      key: 'browser',
      render: (ua) => {
        if (/Chrome/i.test(ua)) return 'Chrome';
        if (/Firefox/i.test(ua)) return 'Firefox';
        if (/Safari/i.test(ua)) return 'Safari';
        if (/Edg/i.test(ua)) return 'Edge';
        return '未知';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '✅ 成功' : '❌ 失败'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <h1>🔐 登录日志</h1>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日登录"
              value={stats?.today || 0}
              prefix={<LoginOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本周登录"
              value={stats?.week || 0}
              prefix={<LoginOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月登录"
              value={stats?.month || 0}
              prefix={<LoginOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="登录失败"
              value={stats?.failed || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索 IP 地址"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchIp}
            onChange={(e) => setSearchIp(e.target.value)}
            onPressEnter={loadLoginLogs}
          />
          <Select
            style={{ width: 120 }}
            value={filterDevice}
            onChange={setFilterDevice}
          >
            <Select.Option value="all">全部设备</Select.Option>
            <Select.Option value="mobile">📱 手机</Select.Option>
            <Select.Option value="tablet">📲 平板</Select.Option>
            <Select.Option value="desktop">💻 电脑</Select.Option>
            <Select.Option value="unknown">❓ 未知</Select.Option>
          </Select>
          <Select
            style={{ width: 120 }}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="success">✅ 成功</Select.Option>
            <Select.Option value="failed">❌ 失败</Select.Option>
          </Select>
          <Button type="primary" onClick={loadLoginLogs}>
            搜索
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}

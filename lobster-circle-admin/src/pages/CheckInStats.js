/**
 * 签到统计页面
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Statistic, Row, Col, DatePicker } from 'antd';
import { CalendarOutlined, TrendingUpOutlined, UserOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

const API_BASE_URL = 'http://localhost:3000/api';

export default function CheckInStats() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);

  useEffect(() => {
    loadCheckInStats();
  }, []);

  const loadCheckInStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/analytics/checkin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.stats);

      // 模拟签到趋势数据
      setTrendData([
        { date: '周一', count: 120 },
        { date: '周二', count: 150 },
        { date: '周三', count: 180 },
        { date: '周四', count: 200 },
        { date: '周五', count: 250 },
        { date: '周六', count: 300 },
        { date: '周日', count: 280 },
      ]);
    } catch (error) {
      message.error('加载签到数据失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '排名',
      key: 'rank',
      render: (_, __, index) => <span>#{index + 1}</span>,
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '连续签到',
      dataIndex: 'streak',
      key: 'streak',
      sorter: (a, b) => a.streak - b.streak,
    },
    {
      title: '总签到次数',
      dataIndex: 'total',
      key: 'total',
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      sorter: (a, b) => a.points - b.points,
    },
  ];

  // 模拟签到排行榜数据
  const topUsers = [
    { key: '1', username: '龙虾', streak: 30, total: 30, points: 510 },
    { key: '2', username: '小明', streak: 25, total: 28, points: 420 },
    { key: '3', username: '小红', streak: 20, total: 25, points: 380 },
    { key: '4', username: '阿强', streak: 15, total: 20, points: 300 },
    { key: '5', username: '美食家', streak: 10, total: 15, points: 220 },
  ];

  return (
    <div>
      <h1>📅 签到统计</h1>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日签到"
              value={stats?.todayCheckIns || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均连续签到"
              value={Math.round(stats?.avgStreak) || 0}
              suffix="天"
              prefix={<TrendingUpOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="签到用户"
              value={topUsers.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="签到趋势（近 7 天）" style={{ marginBottom: 16 }}>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#00ff88" name="签到人数" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="签到排行榜">
        <Table
          columns={columns}
          dataSource={topUsers}
          loading={loading}
          rowKey="key"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}

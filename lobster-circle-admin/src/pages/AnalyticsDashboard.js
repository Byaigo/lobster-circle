/**
 * 数据分析页面
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, Alert } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  OnlineOutlined,
  TrendingUpOutlined,
  LikeOutlined,
  MessageOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/analytics/full-report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReport(response.data.report);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!report) {
    return <Alert message="加载数据失败" type="error" />;
  }

  const { basicStats, trends, activeUsers, checkInStats, contentStats } = report;

  return (
    <div>
      <h1>📊 数据分析</h1>

      {/* 基础统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={basicStats.users.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
              今日新增：+{basicStats.users.newToday}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线用户"
              value={basicStats.users.online}
              prefix={<OnlineOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总动态数"
              value={basicStats.posts.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总消息数"
              value={basicStats.messages.total}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 活跃用户 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="活跃用户">
            <Statistic title="DAU（日活）" value={activeUsers.dau} prefix={<UserOutlined />} />
            <Statistic title="WAU（周活）" value={activeUsers.wau} style={{ marginTop: 15 }} />
            <Statistic title="MAU（月活）" value={activeUsers.mau} style={{ marginTop: 15 }} />
            <div style={{ marginTop: 15, padding: '10px', background: '#f5f5f5', borderRadius: 5 }}>
              <div>DAU/MAU: {(activeUsers.dauMauRatio * 100).toFixed(1)}%</div>
              <div>DAU/WAU: {(activeUsers.dauWauRatio * 100).toFixed(1)}%</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="签到统计">
            <Statistic title="今日签到" value={checkInStats.todayCheckIns} />
            <Statistic title="平均连续签到" value={Math.round(checkInStats.avgStreak)} suffix="天" style={{ marginTop: 15 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="内容统计">
            <Statistic title="总点赞数" value={contentStats.totalLikes} prefix={<LikeOutlined />} />
            <Statistic title="总评论数" value={contentStats.totalComments} prefix={<MessageOutlined />} style={{ marginTop: 15 }} />
            <div style={{ marginTop: 15, fontSize: 12, color: '#666' }}>
              均点赞：{contentStats.avgLikesPerPost.toFixed(1)}<br />
              均评论：{contentStats.avgCommentsPerPost.toFixed(1)}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 用户增长趋势 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="用户增长趋势（30 天）">
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={trends.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#1890ff" strokeWidth={2} name="新增用户" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="动态发布趋势（30 天）">
            <div style={{ height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={trends.postGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="posts" fill="#52c41a" name="发布数量" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

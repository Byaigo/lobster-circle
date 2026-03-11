/**
 * 操作日志页面
 */

import React, { useState, useEffect } from 'react';
import { Table, Tag, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export default function OperationLogs() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // 模拟数据（实际应从 API 获取）
  useEffect(() => {
    setLogs([
      {
        _id: '1',
        adminId: 'admin',
        action: 'update_config',
        module: 'config',
        details: { key: 'allow_post', value: false },
        ip: '192.168.1.100',
        status: 'success',
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        adminId: 'admin',
        action: 'ban_user',
        module: 'user',
        targetId: 'user123',
        details: { reason: 'spam' },
        ip: '192.168.1.100',
        status: 'success',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]);
  }, []);

  const columns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '管理员',
      dataIndex: 'adminId',
      key: 'adminId',
      render: (id) => id || '系统'
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action'
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      render: (m) => <Tag>{m}</Tag>
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      render: (d) => JSON.stringify(d)
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={s === 'success' ? 'green' : 'red'}>{s === 'success' ? '成功' : '失败'}</Tag>
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>📋 操作日志</h1>
        <Input
          placeholder="搜索日志"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}

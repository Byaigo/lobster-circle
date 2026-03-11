/**
 * 系统配置页面
 */

import React, { useState, useEffect } from 'react';
import { Table, Switch, Input, Button, Space, Tag, message, Card } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function ConfigManagement() {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfigs(response.data.configs || []);
    } catch (error) {
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_BASE_URL}/config/${key}`,
        { value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('配置已更新');
      setEditingKey(null);
      loadConfigs();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    {
      title: '配置项',
      dataIndex: 'key',
      key: 'key'
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (value, record) => {
        if (editingKey === record.key) {
          if (typeof value === 'boolean') {
            return (
              <Switch
                checked={editValue !== null ? editValue : value}
                onChange={(checked) => setEditValue(checked)}
              />
            );
          }
          return (
            <Input
              value={editValue !== null ? editValue : value}
              onChange={(e) => setEditValue(e.target.value)}
              style={{ width: 200 }}
            />
          );
        }
        if (typeof value === 'boolean') {
          return <Tag color={value ? 'green' : 'red'}>{value ? '启用' : '禁用'}</Tag>;
        }
        return value;
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag>{cat}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        if (editingKey === record.key) {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => handleUpdate(record.key, editValue !== null ? editValue : record.value)}
              >
                保存
              </Button>
              <Button size="small" onClick={() => setEditingKey(null)}>取消</Button>
            </Space>
          );
        }
        return (
          <Button
            size="small"
            onClick={() => {
              setEditingKey(record.key);
              setEditValue(record.value);
            }}
          >
            编辑
          </Button>
        );
      }
    }
  ];

  return (
    <div>
      <h1>⚙️ 系统配置</h1>
      
      <Card style={{ marginBottom: 16 }}>
        <p>📝 在这里可以动态控制系统各项功能的开关状态，修改后即时生效。</p>
      </Card>

      <Table
        columns={columns}
        dataSource={configs}
        loading={loading}
        rowKey="key"
        pagination={false}
      />
    </div>
  );
}

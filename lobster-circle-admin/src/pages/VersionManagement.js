/**
 * 版本管理页面
 */

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Space, Tag, Modal, message, Switch } from 'antd';
import { VersionOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function VersionManagement() {
  const [loading, setLoading] = useState(false);
  const [versionForm] = Form.useForm();
  const [currentVersion, setCurrentVersion] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);

  useEffect(() => {
    loadVersionInfo();
  }, []);

  const loadVersionInfo = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const configs = response.data.configs || [];
      const appVersion = configs.find(c => c.key === 'app_version');
      const minVersion = configs.find(c => c.key === 'min_app_version');
      const announcement = configs.find(c => c.key === 'announcement');

      setCurrentVersion({
        version: appVersion?.value || '1.0.0',
        minVersion: minVersion?.value || '1.0.0',
        announcement: announcement?.value || '',
      });

      versionForm.setFieldsValue({
        version: appVersion?.value || '1.0.0',
        minVersion: minVersion?.value || '1.0.0',
        announcement: announcement?.value || '',
      });

      // 模拟版本历史
      setVersionHistory([
        { key: '1', version: '1.0.0', releaseDate: '2026-03-11', changes: '初始版本', forceUpdate: false },
      ]);
    } catch (error) {
      message.error('加载版本信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await versionForm.validateFields();
      const token = localStorage.getItem('admin_token');

      await axios.put(`${API_BASE_URL}/version/version`, {
        version: values.version,
        minVersion: values.forceUpdate ? values.version : values.minVersion,
        announcement: values.announcement,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('版本信息已更新');
      loadVersionInfo();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '发布日期',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
    },
    {
      title: '更新内容',
      dataIndex: 'changes',
      key: 'changes',
    },
    {
      title: '强制更新',
      dataIndex: 'forceUpdate',
      key: 'forceUpdate',
      render: (v) => v ? <Tag color="red">是</Tag> : <Tag>否</Tag>,
    },
  ];

  return (
    <div>
      <h1>📱 版本管理</h1>

      <Card title="当前版本信息" style={{ marginBottom: 16 }}>
        {currentVersion && (
          <div>
            <p><strong>当前版本：</strong>{currentVersion.version}</p>
            <p><strong>最低版本：</strong>{currentVersion.minVersion}</p>
            <p><strong>系统公告：</strong>{currentVersion.announcement || '无'}</p>
          </div>
        )}
      </Card>

      <Card title="发布新版本" style={{ marginBottom: 16 }}>
        <Form form={versionForm} layout="vertical">
          <Form.Item
            name="version"
            label="新版本号"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="例如：1.0.1" />
          </Form.Item>
          <Form.Item
            name="minVersion"
            label="最低支持版本"
            rules={[{ required: true, message: '请输入最低版本' }]}
          >
            <Input placeholder="例如：1.0.0" />
          </Form.Item>
          <Form.Item
            name="announcement"
            label="系统公告"
          >
            <Input.TextArea rows={4} placeholder="输入公告内容..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<VersionOutlined />} onClick={handleSave}>
                发布版本
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="版本历史">
        <Table
          columns={columns}
          dataSource={versionHistory}
          loading={loading}
          rowKey="key"
          pagination={false}
        />
      </Card>
    </div>
  );
}

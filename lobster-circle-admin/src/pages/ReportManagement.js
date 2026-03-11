/**
 * 举报管理页面
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Select, Input, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const reasonMap = {
  spam: '垃圾广告',
  harassment: '骚扰',
  hate_speech: '仇恨言论',
  violence: '暴力',
  adult_content: '成人内容',
  copyright: '版权侵犯',
  other: '其他'
};

export default function ReportManagement() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [handleForm] = Form.useForm();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports || []);
    } catch (error) {
      message.error('加载举报列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (status, action) => {
    try {
      const values = await handleForm.validateFields();
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${API_BASE_URL}/admin/reports/${selectedReport._id}/handle`,
        { status, action, note: values.note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('举报已处理');
      setHandleModalVisible(false);
      loadReports();
    } catch (error) {
      message.error('处理失败');
    }
  };

  const columns = [
    {
      title: '举报 ID',
      dataIndex: '_id',
      key: '_id',
      width: 100,
      render: (id) => `...${id.slice(-6)}`
    },
    {
      title: '举报人',
      dataIndex: 'reporter',
      key: 'reporter',
      render: (user) => user?.username || '未知'
    },
    {
      title: '类型',
      dataIndex: 'targetType',
      key: 'targetType',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => reasonMap[reason] || reason
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = { pending: 'orange', reviewing: 'blue', resolved: 'green', rejected: 'red' };
        const texts = { pending: '待处理', reviewing: '处理中', resolved: '已解决', rejected: '已拒绝' };
        return <Tag color={colors[status]}>{texts[status]}</Tag>;
      }
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.status === 'pending' ? (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => {
                setSelectedReport(record);
                setHandleModalVisible(true);
              }}
            >
              处理
            </Button>
          </Space>
        ) : (
          <Tag>{record.handledBy?.username || '系统'}</Tag>
        )
      )
    }
  ];

  return (
    <div>
      <h1>🚨 举报管理</h1>
      
      <Table
        columns={columns}
        dataSource={reports}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="处理举报"
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        footer={null}
      >
        <Form form={handleForm} layout="vertical">
          <Form.Item
            name="status"
            label="处理结果"
            rules={[{ required: true }]}
            initialValue="resolved"
          >
            <Select>
              <Select.Option value="resolved">已解决</Select.Option>
              <Select.Option value="rejected">已拒绝</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="action"
            label="采取行动"
          >
            <Select>
              <Select.Option value="none">仅处理举报</Select.Option>
              <Select.Option value="delete_post">删除内容</Select.Option>
              <Select.Option value="ban_user">封禁用户</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="note"
            label="处理备注"
          >
            <Input.TextArea rows={4} placeholder="填写处理说明..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setHandleModalVisible(false)}>取消</Button>
              <Button type="primary" onClick={() => handleReport('resolved', handleForm.getFieldValue('action'))}>
                确认处理
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

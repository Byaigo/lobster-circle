/**
 * 用户反馈管理页面
 */

import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Button, Input, Modal, Form, message, Select } from 'antd';
import { EyeOutlined, ReplyOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const typeMap = {
  bug: { text: 'Bug 反馈', color: 'red' },
  suggestion: { text: '功能建议', color: 'blue' },
  complaint: { text: '投诉建议', color: 'orange' },
  other: { text: '其他', color: 'default' },
};

const statusMap = {
  pending: { text: '待处理', color: 'orange' },
  processing: { text: '处理中', color: 'blue' },
  resolved: { text: '已解决', color: 'green' },
  rejected: { text: '已拒绝', color: 'default' },
};

export default function FeedbackManagement() {
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyForm] = Form.useForm();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadFeedbacks();
  }, [filterType, filterStatus]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      let url = `${API_BASE_URL}/feedback?`;
      if (filterType !== 'all') url += `type=${filterType}&`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(response.data.feedbacks || []);
    } catch (error) {
      message.error('加载反馈失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    try {
      const values = await replyForm.validateFields();
      const token = localStorage.getItem('admin_token');

      await axios.post(
        `${API_BASE_URL}/feedback/${selectedFeedback._id}/reply`,
        { reply: values.reply, status: values.status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('回复成功');
      setReplyModalVisible(false);
      loadFeedbacks();
      replyForm.resetFields();
    } catch (error) {
      message.error('回复失败');
    }
  };

  const columns = [
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      render: (user) => <span>{user?.username || '未知用户'}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={typeMap[type]?.color}>{typeMap[type]?.text || type}</Tag>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 300,
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      key: 'contact',
      render: (contact) => contact || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || status}</Tag>
      ),
    },
    {
      title: '回复',
      dataIndex: 'reply',
      key: 'reply',
      ellipsis: true,
      width: 200,
      render: (reply) => reply || <span style={{ color: '#999' }}>未回复</span>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString(),
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedFeedback(record);
              setReplyModalVisible(true);
              replyForm.setFieldsValue({
                status: record.status,
                reply: record.reply || '',
              });
            }}
          >
            查看/回复
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>📝 用户反馈</h1>
        <Space>
          <Select
            style={{ width: 120 }}
            value={filterType}
            onChange={setFilterType}
          >
            <Select.Option value="all">全部类型</Select.Option>
            <Select.Option value="bug">Bug 反馈</Select.Option>
            <Select.Option value="suggestion">功能建议</Select.Option>
            <Select.Option value="complaint">投诉建议</Select.Option>
            <Select.Option value="other">其他</Select.Option>
          </Select>
          <Select
            style={{ width: 120 }}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Select.Option value="all">全部状态</Select.Option>
            <Select.Option value="pending">待处理</Select.Option>
            <Select.Option value="processing">处理中</Select.Option>
            <Select.Option value="resolved">已解决</Select.Option>
            <Select.Option value="rejected">已拒绝</Select.Option>
          </Select>
          <Input
            placeholder="搜索内容"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={feedbacks}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="📝 查看/回复反馈"
        open={replyModalVisible}
        onCancel={() => setReplyModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedFeedback && (
          <>
            <div style={{ marginBottom: 16 }}>
              <strong>用户：</strong>{selectedFeedback.userId?.username || '未知用户'}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>类型：</strong>
              <Tag color={typeMap[selectedFeedback.type]?.color}>
                {typeMap[selectedFeedback.type]?.text}
              </Tag>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>内容：</strong>
              <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                {selectedFeedback.content}
              </div>
            </div>
            {selectedFeedback.contact && (
              <div style={{ marginBottom: 16 }}>
                <strong>联系方式：</strong>{selectedFeedback.contact}
              </div>
            )}
            {selectedFeedback.reply && (
              <div style={{ marginBottom: 16 }}>
                <strong>已回复：</strong>
                <div style={{ marginTop: 8, padding: 12, background: '#e8f5e9', borderRadius: 6 }}>
                  {selectedFeedback.reply}
                </div>
              </div>
            )}

            <Form form={replyForm} layout="vertical">
              <Form.Item
                name="status"
                label="处理状态"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="pending">待处理</Select.Option>
                  <Select.Option value="processing">处理中</Select.Option>
                  <Select.Option value="resolved">已解决</Select.Option>
                  <Select.Option value="rejected">已拒绝</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="reply"
                label="回复内容"
                rules={[{ required: true, message: '请输入回复内容' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请输入回复内容..."
                />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button onClick={() => setReplyModalVisible(false)}>取消</Button>
                  <Button type="primary" onClick={handleReply}>
                    提交回复
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}

/**
 * 用户管理页面
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Modal, Form, Select, message, Tag, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function UserManagement() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [banModalVisible, setBanModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [resetPwdModalVisible, setResetPwdModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [resetPwdForm] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/admin/users?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    try {
      const values = await banForm.validateFields();
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${API_BASE_URL}/admin/users/${selectedUser._id}/ban`,
        { isBanned: true, reason: values.reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('用户已封禁');
      setBanModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEdit = async () => {
    try {
      const values = await editForm.validateFields();
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API_BASE_URL}/admin/users/${selectedUser._id}`,
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('用户信息已更新');
      setEditModalVisible(false);
      loadUsers();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleResetPassword = async () => {
    try {
      const values = await resetPwdForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次密码不一致');
        return;
      }
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${API_BASE_URL}/admin/users/${selectedUser._id}/reset-password`,
        { newPassword: values.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('密码已重置');
      setResetPwdModalVisible(false);
    } catch (error) {
      message.error('重置密码失败');
    }
  };

  const handleUnban = async (userId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${API_BASE_URL}/admin/users/${userId}/ban`,
        { isBanned: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('用户已解封');
      loadUsers();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <Avatar>{record.avatar || '😎'}</Avatar>
          <div>
            <div>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email || '无邮箱'}</div>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        record.isBanned ? (
          <Tag color="red">已封禁</Tag>
        ) : record.isOnline ? (
          <Tag color="green">在线</Tag>
        ) : (
          <Tag>离线</Tag>
        )
      )
    },
    {
      title: '粉丝',
      dataIndex: 'followers',
      key: 'followers',
      render: (count) => count?.length || 0
    },
    {
      title: '关注',
      dataIndex: 'following',
      key: 'following',
      render: (count) => count?.length || 0
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedUser(record);
              editForm.setFieldsValue({
                username: record.username,
                avatar: record.avatar,
                bio: record.bio,
              });
              setEditModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            size="small"
            onClick={() => {
              setSelectedUser(record);
              resetPwdForm.resetFields();
              setResetPwdModalVisible(true);
            }}
          >
            重置密码
          </Button>
          {record.isBanned ? (
            <Button size="small" onClick={() => handleUnban(record._id)}>解封</Button>
          ) : (
            <Button
              size="small"
              danger
              onClick={() => {
                setSelectedUser(record);
                setBanModalVisible(true);
              }}
            >
              封禁
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>👥 用户管理</h1>
        <Space>
          <Input
            placeholder="搜索用户"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />}>添加用户</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="_id"
        pagination={{
          current: page,
          pageSize: 20,
          total: total,
          onChange: (p) => setPage(p)
        }}
      />

      <Modal
        title="封禁用户"
        open={banModalVisible}
        onOk={handleBan}
        onCancel={() => setBanModalVisible(false)}
      >
        <Form form={banForm} layout="vertical">
          <Form.Item
            name="reason"
            label="封禁原因"
            rules={[{ required: true, message: '请输入封禁原因' }]}
          >
            <Select>
              <Select.Option value="spam">发布垃圾广告</Select.Option>
              <Select.Option value="harassment">骚扰其他用户</Select.Option>
              <Select.Option value="hate_speech">发布仇恨言论</Select.Option>
              <Select.Option value="violence">发布暴力内容</Select.Option>
              <Select.Option value="adult_content">发布成人内容</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户信息弹窗 */}
      <Modal
        title="编辑用户信息"
        open={editModalVisible}
        onOk={handleEdit}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="avatar"
            label="头像 Emoji"
          >
            <Input placeholder="例如：😎" />
          </Form.Item>
          <Form.Item
            name="bio"
            label="个人简介"
          >
            <Input.TextArea rows={4} placeholder="请输入个人简介" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        title="重置用户密码"
        open={resetPwdModalVisible}
        onOk={handleResetPassword}
        onCancel={() => setResetPwdModalVisible(false)}
      >
        <Form form={resetPwdForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少 6 个字符' }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[{ required: true, message: '请再次输入密码' }]}
          >
            <Input.Password placeholder="请再次输入密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/**
 * 内容审核页面
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Input, Tag, message, Modal, Popconfirm } from 'antd';
import { SearchOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function PostManagement() {
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadPosts();
  }, [page]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/admin/posts?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data.posts || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      message.error('加载动态列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_BASE_URL}/admin/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('动态已删除');
      loadPosts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: '_id',
      key: '_id',
      width: 100,
      render: (id) => `...${id.slice(-6)}`
    },
    {
      title: '作者',
      dataIndex: 'userId',
      key: 'userId',
      render: (user) => (
        <Space>
          <Avatar>{user?.avatar || '😎'}</Avatar>
          <span>{user?.username || '未知用户'}</span>
        </Space>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 300
    },
    {
      title: '图片',
      key: 'images',
      render: (_, record) => record.images?.length || 0
    },
    {
      title: '点赞',
      dataIndex: 'likes',
      key: 'likes',
      render: (count) => count?.length || 0
    },
    {
      title: '评论',
      dataIndex: 'comments',
      key: 'comments',
      render: (count) => count?.length || 0
    },
    {
      title: '可见性',
      dataIndex: 'visibility',
      key: 'visibility',
      render: (v) => {
        const colors = { public: 'green', friends: 'blue', private: 'grey' };
        return <Tag color={colors[v]}>{v === 'public' ? '公开' : v === 'friends' ? '好友' : '私密'}</Tag>;
      }
    },
    {
      title: '发布时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}>查看</Button>
          <Popconfirm
            title="确定删除此动态？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h1>📝 内容审核</h1>
        <Input
          placeholder="搜索内容"
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={posts}
        loading={loading}
        rowKey="_id"
        pagination={{
          current: page,
          pageSize: 20,
          total: total,
          onChange: (p) => setPage(p)
        }}
      />
    </div>
  );
}

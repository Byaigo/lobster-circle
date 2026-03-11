/**
 * 敏感词管理页面
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Tag, Modal, Form, Select, message, Popconfirm } from 'antd';
import { SearchOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export default function SensitiveWordManagement() {
  const [loading, setLoading] = useState(false);
  const [words, setWords] = useState([]);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/sensitive-words`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWords(response.data.words || []);
    } catch (error) {
      message.error('加载敏感词列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${API_BASE_URL}/sensitive-words`,
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success('敏感词已添加');
      setAddModalVisible(false);
      addForm.resetFields();
      loadWords();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_BASE_URL}/sensitive-words/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('敏感词已删除');
      loadWords();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '敏感词',
      dataIndex: 'word',
      key: 'word'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => {
        const colors = { politics: 'red', porn: 'purple', violence: 'orange', spam: 'gold', ad: 'blue', other: 'default' };
        return <Tag color={colors[cat]}>{cat}</Tag>;
      }
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level) => {
        const colors = { low: 'green', medium: 'orange', high: 'red' };
        return <Tag color={colors[level]}>{level}</Tag>;
      }
    },
    {
      title: '处理方式',
      dataIndex: 'action',
      key: 'action',
      render: (action) => {
        const texts = { block: '阻止', replace: '替换', review: '审核' };
        return <Tag>{texts[action]}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active) => <Tag color={active ? 'green' : 'default'}>{active ? '启用' : '禁用'}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="确定删除此敏感词？"
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
        <h1>🚫 敏感词管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
          添加敏感词
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={words}
        loading={loading}
        rowKey="_id"
        pagination={{ pageSize: 50 }}
      />

      <Modal
        title="添加敏感词"
        open={addModalVisible}
        onOk={handleAdd}
        onCancel={() => setAddModalVisible(false)}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="word"
            label="敏感词"
            rules={[{ required: true, message: '请输入敏感词' }]}
          >
            <Input placeholder="请输入敏感词" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            initialValue="other"
          >
            <Select>
              <Select.Option value="politics">政治敏感</Select.Option>
              <Select.Option value="porn">色情内容</Select.Option>
              <Select.Option value="violence">暴力内容</Select.Option>
              <Select.Option value="spam">垃圾广告</Select.Option>
              <Select.Option value="ad">广告推广</Select.Option>
              <Select.Option value="other">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="level"
            label="级别"
            initialValue="medium"
          >
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="action"
            label="处理方式"
            initialValue="block"
          >
            <Select>
              <Select.Option value="block">阻止发布</Select.Option>
              <Select.Option value="replace">自动替换</Select.Option>
              <Select.Option value="review">需要审核</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

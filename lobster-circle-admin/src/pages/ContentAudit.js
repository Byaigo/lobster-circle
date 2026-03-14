/**
 * 内容审核管理页面
 * 
 * 功能：
 * - 审核统计看板
 * - 待审核内容列表
 * - 审核历史查询
 * - 通过/拒绝操作
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Select,
  Space,
  Tag,
  Modal,
  message,
  Statistic,
  Row,
  Col,
  Typography,
  Badge,
  Tooltip,
  DatePicker,
  Popconfirm,
  Image,
  Tabs,
} from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  WarningOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const ContentAudit = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [logs, setLogs] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    result: undefined,
    contentType: undefined,
    dateRange: undefined,
  });
  const [detailModal, setDetailModal] = useState({
    visible: false,
    log: null,
  });

  // 结果映射
  const resultLabels = {
    pass: { text: '通过', color: 'green' },
    review: { text: '待审核', color: 'orange' },
    block: { text: '屏蔽', color: 'red' },
  };

  // 内容类型映射
  const contentTypeLabels = {
    text: '文本',
    image: '图片',
    comment: '评论',
    nickname: '昵称',
    bio: '简介',
  };

  // 加载统计
  const loadStats = async (timeRange = '24h') => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/audit/stats?timeRange=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 加载审核列表
  const loadLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      });
      
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.append('startDate', filters.dateRange[0].valueOf());
        params.append('endDate', filters.dateRange[1].valueOf());
      }
      
      const response = await fetch(`${API_BASE_URL}/api/audit?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setLogs(result.data.logs);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
        }));
      }
    } catch (error) {
      console.error('加载审核列表失败:', error);
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载待审核内容
  const loadPending = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/audit/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setPending(result.data.pending);
      }
    } catch (error) {
      console.error('加载待审核内容失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    if (activeTab === 'pending') {
      loadPending();
    } else {
      loadLogs();
    }
  }, [activeTab, pagination.current, pagination.pageSize]);

  // 处理审核
  const handleProcess = async (id, decision) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/audit/${id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision,
          note: decision === 'approve' ? '审核通过' : '审核拒绝',
        }),
      });
      
      if (response.ok) {
        message.success(decision === 'approve' ? '已通过' : '已拒绝');
        loadPending();
        loadStats();
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      console.error('处理审核失败:', error);
      message.error('操作失败');
    }
  };

  // 清理旧日志
  const handleCleanup = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/audit/cleanup?daysToKeep=90`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        message.success(`已清理 ${result.data.deletedCount} 条旧日志`);
        loadLogs();
        loadStats();
      } else {
        message.error('清理失败');
      }
    } catch (error) {
      console.error('清理失败:', error);
      message.error('清理失败');
    }
  };

  // 待审核表格列
  const pendingColumns = [
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 100,
      render: (type) => <Tag>{contentTypeLabels[type] || type}</Tag>,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 300,
      render: (content, record) => {
        if (record.contentType === 'image') {
          return <Image src={content} width={100} height={100} style={{ objectFit: 'cover' }} />;
        }
        return content;
      },
    },
    {
      title: '用户',
      dataIndex: ['userId', 'username'],
      key: 'userId',
      width: 120,
      render: (username, record) => (
        <Space>
          <span>{record.userId?.avatar || '😐'}</span>
          <span>{username || '未知用户'}</span>
        </Space>
      ),
    },
    {
      title: '标签',
      dataIndex: 'labels',
      key: 'labels',
      width: 150,
      render: (labels) => (
        <Space wrap>
          {labels?.map((label, i) => (
            <Tag key={i} color="red">{label}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp) => new Date(timestamp).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="通过">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              size="small"
              onClick={() => handleProcess(record._id, 'approve')}
            />
          </Tooltip>
          <Tooltip title="拒绝">
            <Button
              danger
              icon={<CloseCircleOutlined />}
              size="small"
              onClick={() => handleProcess(record._id, 'reject')}
            />
          </Tooltip>
          <Tooltip title="详情">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => setDetailModal({ visible: true, log: record })}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 历史表格列
  const historyColumns = [
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result) => (
        <Badge color={resultLabels[result]?.color} text={resultLabels[result]?.text} />
      ),
    },
    {
      title: '类型',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 100,
      render: (type) => <Tag>{contentTypeLabels[type] || type}</Tag>,
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 250,
    },
    {
      title: '用户',
      dataIndex: ['userId', 'username'],
      key: 'userId',
      width: 120,
      render: (username) => username || '未知用户',
    },
    {
      title: '标签',
      dataIndex: 'labels',
      key: 'labels',
      width: 150,
      render: (labels) => (
        <Space wrap>
          {labels?.map((label, i) => (
            <Tag key={i} color={label === 'custom' ? 'orange' : 'red'}>{label}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp) => new Date(timestamp).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => setDetailModal({ visible: true, log: record })}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 统计卡片 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="审核总数"
                value={stats?.total || 0}
                prefix={<SafetyOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待审核"
                value={stats?.reviewCount || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已屏蔽"
                value={stats?.blockedCount || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="通过率"
                value={
                  stats?.total > 0
                    ? Math.round(((stats.total - stats.blockedCount - stats.reviewCount) / stats.total) * 100)
                    : 0
                }
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        {/* 选项卡 */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane
              tab={
                <span>
                  <WarningOutlined />
                  待审核
                  {stats?.reviewCount > 0 && (
                    <Badge count={stats.reviewCount} style={{ marginLeft: 8 }} />
                  )}
                </span>
              }
              key="pending"
            >
              <Table
                columns={pendingColumns}
                dataSource={pending}
                loading={loading}
                rowKey="_id"
                pagination={false}
              />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <SafetyOutlined />
                  审核历史
                </span>
              }
              key="history"
            >
              <Space wrap style={{ marginBottom: 16 }}>
                <Select
                  placeholder="审核结果"
                  allowClear
                  style={{ width: 120 }}
                  value={filters.result}
                  onChange={(value) => setFilters(prev => ({ ...prev, result: value }))}
                >
                  <Option value="pass">通过</Option>
                  <Option value="review">待审核</Option>
                  <Option value="block">屏蔽</Option>
                </Select>
                
                <Select
                  placeholder="内容类型"
                  allowClear
                  style={{ width: 120 }}
                  value={filters.contentType}
                  onChange={(value) => setFilters(prev => ({ ...prev, contentType: value }))}
                >
                  {Object.entries(contentTypeLabels).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
                
                <RangePicker
                  value={filters.dateRange}
                  onChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                />
                
                <Button
                  type="primary"
                  onClick={loadLogs}
                >
                  筛选
                </Button>
                
                <Button onClick={() => setFilters({ result: undefined, contentType: undefined, dateRange: undefined })}>
                  重置
                </Button>
                
                <Popconfirm
                  title="确定要清理 90 天前的已处理日志吗？"
                  onConfirm={handleCleanup}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button danger>清理旧日志</Button>
                </Popconfirm>
                
                <Button icon={<ReloadOutlined />} onClick={loadLogs}>
                  刷新
                </Button>
              </Space>
              
              <Table
                columns={historyColumns}
                dataSource={logs}
                loading={loading}
                rowKey="_id"
                pagination={{
                  ...pagination,
                  onChange: (page, pageSize) => {
                    setPagination(prev => ({
                      ...prev,
                      current: page,
                      pageSize,
                    }));
                  },
                }}
              />
            </TabPane>
          </Tabs>
        </Card>
      </Space>

      {/* 详情弹窗 */}
      <Modal
        title="审核详情"
        visible={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, log: null })}
        footer={null}
        width={700}
      >
        {detailModal.log && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <strong>审核结果：</strong>
              <Badge color={resultLabels[detailModal.log.result]?.color} text={resultLabels[detailModal.log.result]?.text} />
            </div>
            <div>
              <strong>内容类型：</strong> {contentTypeLabels[detailModal.log.contentType]}
            </div>
            <div>
              <strong>内容：</strong>
              {detailModal.log.contentType === 'image' ? (
                <Image src={detailModal.log.content} width={300} style={{ marginTop: 8 }} />
              ) : (
                <p style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {detailModal.log.content}
                </p>
              )}
            </div>
            <div>
              <strong>违规标签：</strong>
              <Space wrap>
                {detailModal.log.labels?.map((label, i) => (
                  <Tag key={i} color="red">{label}</Tag>
                ))}
              </Space>
            </div>
            {detailModal.log.keywords?.length > 0 && (
              <div>
                <strong>敏感词：</strong>
                <Space wrap>
                  {detailModal.log.keywords.map((word, i) => (
                    <Tag key={i} color="orange">{word}</Tag>
                  ))}
                </Space>
              </div>
            )}
            <div>
              <strong>置信度：</strong> {(detailModal.log.confidence * 100).toFixed(2)}%
            </div>
            <div>
              <strong>用户：</strong> {detailModal.log.userId?.username || '未知用户'}
            </div>
            <div>
              <strong>时间：</strong> {new Date(detailModal.log.timestamp).toLocaleString('zh-CN')}
            </div>
            {detailModal.log.isProcessed && (
              <>
                <div>
                  <strong>处理状态：</strong> 已处理
                </div>
                <div>
                  <strong>处理备注：</strong> {detailModal.log.processedNote}
                </div>
              </>
            )}
          </Space>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default ContentAudit;

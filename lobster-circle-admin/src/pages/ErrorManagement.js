/**
 * 错误日志管理页面
 * 
 * 功能：
 * - 查看错误列表
 * - 错误统计图表
 * - 筛选和搜索
 * - 标记为已解决
 * - 批量操作
 */

import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Select,
  Input,
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
} from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import AdminLayout from '../components/AdminLayout';
import { API_BASE_URL } from '../config';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const ErrorManagement = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    type: undefined,
    severity: undefined,
    isResolved: undefined,
    component: undefined,
    dateRange: undefined,
  });
  const [selectedRows, setSelectedRows] = useState([]);
  const [detailModal, setDetailModal] = useState({
    visible: false,
    error: null,
  });
  const [resolveModal, setResolveModal] = useState({
    visible: false,
    fingerprint: null,
    note: '',
  });

  // 严重程度颜色映射
  const severityColors = {
    critical: 'red',
    high: 'orange',
    medium: 'gold',
    low: 'blue',
  };

  // 错误类型映射
  const typeLabels = {
    NETWORK_ERROR: '网络错误',
    API_ERROR: 'API 错误',
    VALIDATION_ERROR: '验证错误',
    PERMISSION_ERROR: '权限错误',
    UNKNOWN_ERROR: '未知错误',
    RENDER_ERROR: '渲染错误',
  };

  // 加载错误统计
  const loadStats = async (timeRange = '24h') => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/errors/stats?timeRange=${timeRange}`, {
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

  // 加载错误列表
  const loadErrors = async () => {
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
      
      const response = await fetch(`${API_BASE_URL}/api/errors?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setErrors(result.data.errors);
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
        }));
      }
    } catch (error) {
      console.error('加载错误列表失败:', error);
      message.error('加载错误列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadErrors();
  }, [pagination.current, pagination.pageSize]);

  // 处理筛选变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 应用筛选
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadErrors();
  };

  // 重置筛选
  const resetFilters = () => {
    setFilters({
      type: undefined,
      severity: undefined,
      isResolved: undefined,
      component: undefined,
      dateRange: undefined,
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 标记为已解决
  const handleResolve = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/errors/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fingerprint: resolveModal.fingerprint,
          note: resolveModal.note,
        }),
      });
      
      if (response.ok) {
        message.success('已标记为已解决');
        setResolveModal({ visible: false, fingerprint: null, note: '' });
        loadErrors();
        loadStats();
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      console.error('标记失败:', error);
      message.error('操作失败');
    }
  };

  // 批量标记
  const handleBulkResolve = async () => {
    if (selectedRows.length === 0) {
      message.warning('请选择要标记的错误');
      return;
    }
    
    try {
      const token = localStorage.getItem('admin_token');
      const fingerprints = [...new Set(selectedRows.map(r => r.fingerprint))];
      
      const response = await fetch(`${API_BASE_URL}/api/errors/bulk-resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fingerprints,
          note: '批量标记',
        }),
      });
      
      if (response.ok) {
        message.success(`已标记 ${fingerprints.length} 个错误为已解决`);
        setSelectedRows([]);
        loadErrors();
        loadStats();
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      console.error('批量标记失败:', error);
      message.error('操作失败');
    }
  };

  // 清理旧错误
  const handleCleanup = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/api/errors/cleanup?daysToKeep=30`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        message.success(`已清理 ${result.data.deletedCount} 条旧错误`);
        loadErrors();
        loadStats();
      } else {
        message.error('清理失败');
      }
    } catch (error) {
      console.error('清理失败:', error);
      message.error('清理失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity) => (
        <Badge
          color={severityColors[severity] || 'default'}
          text={severity.toUpperCase()}
        />
      ),
      filters: [
        { text: '严重', value: 'critical' },
        { text: '高', value: 'high' },
        { text: '中', value: 'medium' },
        { text: '低', value: 'low' },
      ],
      onFilter: (value, record) => record.severity === value,
    },
    {
      title: '错误类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => (
        <Tag color={severityColors.critical}>{typeLabels[type] || type}</Tag>
      ),
      filters: Object.keys(typeLabels).map(key => ({
        text: typeLabels[key],
        value: key,
      })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '错误消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      width: 300,
    },
    {
      title: '组件',
      dataIndex: 'component',
      key: 'component',
      width: 120,
      filters: errors
        .map(e => e.component)
        .filter((v, i, a) => a.indexOf(v) === i)
        .map(c => ({ text: c, value: c })),
      onFilter: (value, record) => record.component === value,
    },
    {
      title: '发生次数',
      dataIndex: 'occurrenceCount',
      key: 'occurrenceCount',
      width: 100,
      sorter: (a, b) => a.occurrenceCount - b.occurrenceCount,
      render: (count) => <Tag color={count > 10 ? 'red' : 'green'}>{count}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'isResolved',
      key: 'isResolved',
      width: 80,
      filters: [
        { text: '未解决', value: false },
        { text: '已解决', value: true },
      ],
      onFilter: (value, record) => record.isResolved === value,
      render: (isResolved) => (
        <Tag color={isResolved ? 'success' : 'error'}>
          {isResolved ? '已解决' : '未解决'}
        </Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: (a, b) => a.timestamp - b.timestamp,
      render: (timestamp) => new Date(timestamp).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => setDetailModal({ visible: true, error: record })}
            />
          </Tooltip>
          {!record.isResolved && (
            <Tooltip title="标记为已解决">
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() =>
                  setResolveModal({
                    visible: true,
                    fingerprint: record.fingerprint,
                    note: '',
                  })
                }
              />
            </Tooltip>
          )}
        </Space>
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
                title="错误总数"
                value={stats?.total || 0}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="未解决"
                value={stats?.unresolvedCount || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="严重错误"
                value={stats?.bySeverity?.find(s => s._id === 'critical')?.count || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="高频错误"
                value={stats?.topErrors?.[0]?.count || 0}
                suffix={`(${stats?.topErrors?.[0]?._id?.type || '-'})`}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选栏 */}
        <Card>
          <Space wrap>
            <Select
              placeholder="错误类型"
              allowClear
              style={{ width: 150 }}
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
            
            <Select
              placeholder="严重程度"
              allowClear
              style={{ width: 120 }}
              value={filters.severity}
              onChange={(value) => handleFilterChange('severity', value)}
            >
              <Option value="critical">严重</Option>
              <Option value="high">高</Option>
              <Option value="medium">中</Option>
              <Option value="low">低</Option>
            </Select>
            
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              value={filters.isResolved}
              onChange={(value) => handleFilterChange('isResolved', value)}
            >
              <Option value={false}>未解决</Option>
              <Option value={true}>已解决</Option>
            </Select>
            
            <RangePicker
              value={filters.dateRange}
              onChange={(value) => handleFilterChange('dateRange', value)}
            />
            
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={applyFilters}
            >
              筛选
            </Button>
            
            <Button icon={<ReloadOutlined />} onClick={resetFilters}>
              重置
            </Button>
          </Space>
        </Card>

        {/* 操作栏 */}
        <Card>
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleBulkResolve}
              disabled={selectedRows.length === 0}
            >
              批量标记已解决
            </Button>
            
            <Popconfirm
              title="确定要清理 30 天前的已解决错误吗？"
              onConfirm={handleCleanup}
              okText="确定"
              cancelText="取消"
            >
              <Button danger icon={<DeleteOutlined />}>
                清理旧错误
              </Button>
            </Popconfirm>
            
            <Button icon={<ReloadOutlined />} onClick={loadErrors}>
              刷新
            </Button>
          </Space>
        </Card>

        {/* 错误列表 */}
        <Card>
          <Table
            columns={columns}
            dataSource={errors}
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
            rowSelection={{
              selectedRowKeys: selectedRows.map(r => r._id),
              onChange: (selectedRowKeys, selectedRows) => {
                setSelectedRows(selectedRows);
              },
            }}
          />
        </Card>
      </Space>

      {/* 详情弹窗 */}
      <Modal
        title="错误详情"
        visible={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, error: null })}
        footer={null}
        width={800}
      >
        {detailModal.error && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <strong>错误类型：</strong>
              <Tag>{typeLabels[detailModal.error.type]}</Tag>
            </div>
            <div>
              <strong>严重程度：</strong>
              <Badge
                color={severityColors[detailModal.error.severity]}
                text={detailModal.error.severity.toUpperCase()}
              />
            </div>
            <div>
              <strong>错误消息：</strong>
              <p>{detailModal.error.message}</p>
            </div>
            <div>
              <strong>堆栈跟踪：</strong>
              <pre style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                overflow: 'auto',
                maxHeight: 200,
              }}>
                {detailModal.error.stack || '无'}
              </pre>
            </div>
            <div>
              <strong>发生次数：</strong> {detailModal.error.occurrenceCount}
            </div>
            <div>
              <strong>组件：</strong> {detailModal.error.component}
            </div>
            <div>
              <strong>设备：</strong> {detailModal.error.device?.platform} {detailModal.error.device?.model}
            </div>
            <div>
              <strong>用户：</strong> {detailModal.error.user?.userId}
            </div>
            <div>
              <strong>时间：</strong> {new Date(detailModal.error.timestamp).toLocaleString('zh-CN')}
            </div>
            {detailModal.error.isResolved && (
              <div>
                <strong>解决备注：</strong> {detailModal.error.resolvedNote}
              </div>
            )}
          </Space>
        )}
      </Modal>

      {/* 标记解决弹窗 */}
      <Modal
        title="标记为已解决"
        visible={resolveModal.visible}
        onCancel={() => setResolveModal({ visible: false, fingerprint: null, note: '' })}
        onOk={handleResolve}
        okText="确定"
        cancelText="取消"
      >
        <div>
          <p>请添加解决备注：</p>
          <TextArea
            rows={4}
            value={resolveModal.note}
            onChange={(e) =>
              setResolveModal(prev => ({ ...prev, note: e.target.value }))
            }
            placeholder="描述如何解决这个问题的..."
          />
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default ErrorManagement;

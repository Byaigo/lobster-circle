/**
 * 版本更新管理页面
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Space, Alert, Spin, Steps, message, Modal } from 'antd';
import {
  CloudDownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  GithubOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Step } = Steps;

export default function UpdateManager() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [currentVersion, setCurrentVersion] = useState('3.2.0');
  const [latestVersion, setLatestVersion] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState([]);
  const [updateStep, setUpdateStep] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    checkUpdate();
  }, []);

  // 检查更新
  const checkUpdate = async () => {
    setChecking(true);
    try {
      const response = await axios.get(
        'https://api.github.com/repos/Byaigo/lobster-circle/releases/latest'
      );
      
      const latest = response.data;
      const latestVer = latest.tag_name.replace('v', '');
      
      setLatestVersion({
        version: latestVer,
        name: latest.name,
        publishedAt: latest.published_at,
        url: latest.html_url,
        body: latest.body
      });
      
      // 解析更新日志
      const notes = latest.body.split('\n').filter(line => line.startsWith('-')).map(line => {
        const emoji = line.includes('✅') ? 'feat' : line.includes('🐛') ? 'fix' : 'other';
        return {
          emoji,
          text: line.replace(/^[*-]\s*/, '').trim()
        };
      });
      
      setReleaseNotes(notes);
      
      // 比较版本
      const hasNewVersion = compareVersions(latestVer, currentVersion) > 0;
      setHasUpdate(hasNewVersion);
    } catch (error) {
      console.error('检查更新失败:', error);
      message.error('检查更新失败，请检查网络连接');
    } finally {
      setChecking(false);
    }
  };

  // 版本比较
  const compareVersions = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  };

  // 执行更新
  const handleUpdate = async () => {
    Modal.confirm({
      title: '确认更新',
      content: `确定要更新到版本 ${latestVersion?.version} 吗？更新过程需要约 2-5 分钟。`,
      okText: '确认更新',
      cancelText: '取消',
      onOk: async () => {
        setUpdating(true);
        setUpdateStep(0);
        
        try {
          // 步骤 1: 拉取最新代码
          setUpdateStep(1);
          await axios.post('/api/admin/update/pull', {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
          });
          await sleep(2000);
          
          // 步骤 2: 安装依赖
          setUpdateStep(2);
          await axios.post('/api/admin/update/install', {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
          });
          await sleep(2000);
          
          // 步骤 3: 构建
          setUpdateStep(3);
          await axios.post('/api/admin/update/build', {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
          });
          await sleep(2000);
          
          // 步骤 4: 重启服务
          setUpdateStep(4);
          await axios.post('/api/admin/update/restart', {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
          });
          await sleep(2000);
          
          message.success('✅ 更新成功！');
          setCurrentVersion(latestVersion?.version);
          setHasUpdate(false);
          setUpdateStep(0);
        } catch (error) {
          console.error('更新失败:', error);
          message.error('更新失败，请手动更新');
        } finally {
          setUpdating(false);
        }
      }
    });
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  if (checking) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>检查更新中...</div>
      </div>
    );
  }

  return (
    <div>
      <h1>🔄 版本更新</h1>

      {/* 当前版本 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>当前版本</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>v{currentVersion}</div>
          </div>
          
          {latestVersion && (
            <>
              <div style={{ fontSize: 24 }}>→</div>
              <div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>最新版本</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: hasUpdate ? '#52c41a' : '#666' }}>
                  v{latestVersion.version}
                </div>
                {hasUpdate && <Tag color="green" style={{ marginTop: 8 }}>新版本可用</Tag>}
              </div>
            </>
          )}
          
          <Button
            type="primary"
            icon={<CloudDownloadOutlined />}
            disabled={!hasUpdate || updating}
            loading={updating}
            onClick={handleUpdate}
            style={{ marginLeft: 'auto' }}
          >
            {updating ? '更新中...' : '一键更新'}
          </Button>
        </Space>
      </Card>

      {/* 更新步骤 */}
      {updating && (
        <Card style={{ marginBottom: 16 }}>
          <Steps current={updateStep}>
            <Step
              title="拉取代码"
              description="从 GitHub 获取最新代码"
              icon={updating && updateStep >= 1 ? <SyncOutlined spin /> : <GithubOutlined />}
            />
            <Step
              title="安装依赖"
              description="安装 npm 包"
              icon={updating && updateStep >= 2 ? <SyncOutlined spin /> : <CloudDownloadOutlined />}
            />
            <Step
              title="构建项目"
              description="编译前端代码"
              icon={updating && updateStep >= 3 ? <SyncOutlined spin /> : <SyncOutlined />}
            />
            <Step
              title="重启服务"
              description="应用更新"
              icon={updating && updateStep >= 4 ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            />
          </Steps>
        </Card>
      )}

      {/* 更新日志 */}
      {hasUpdate && latestVersion && (
        <Card title="📝 更新日志" style={{ marginBottom: 16 }}>
          <Alert
            message={`版本 ${latestVersion.version}`}
            description={
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {releaseNotes.map((note, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    {note.emoji === 'feat' && '✅ '}
                    {note.emoji === 'fix' && '🐛 '}
                    {note.text}
                  </div>
                ))}
              </div>
            }
            type="info"
            showIcon
          />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <a href={latestVersion.url} target="_blank" rel="noopener noreferrer">
              查看完整发布说明 <GithubOutlined />
            </a>
          </div>
        </Card>
      )}

      {/* 自动检查设置 */}
      <Card title="⚙️ 自动检查设置">
        <Alert
          message="自动检查已启用"
          description="系统会每天自动检查一次更新，有新版本时会在侧边栏显示提示。"
          type="success"
          showIcon
        />
      </Card>
    </div>
  );
}

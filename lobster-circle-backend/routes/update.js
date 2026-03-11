/**
 * 自动更新 API
 */

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const adminAuth = require('../middleware/auth');

// 项目根目录
const ROOT_DIR = path.join(__dirname, '..', '..', '..');

// 检查更新
router.get('/check', adminAuth, async (req, res) => {
  try {
    // 获取当前版本
    const packagePath = path.join(ROOT_DIR, 'lobster-circle-backend', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version;

    // 获取最新版本
    const https = require('https');
    
    https.get('https://api.github.com/repos/Byaigo/lobster-circle/releases/latest', (response) => {
      let data = '';
      
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        try {
          const latest = JSON.parse(data);
          const latestVersion = latest.tag_name.replace('v', '');
          
          res.json({
            currentVersion,
            latestVersion: {
              version: latestVersion,
              name: latest.name,
              publishedAt: latest.published_at,
              url: latest.html_url,
              body: latest.body
            },
            hasUpdate: compareVersions(latestVersion, currentVersion) > 0
          });
        } catch (error) {
          res.status(500).json({ error: '解析更新信息失败' });
        }
      });
    }).on('error', (error) => {
      res.status(500).json({ error: '检查更新失败' });
    });
  } catch (error) {
    res.status(500).json({ error: '检查更新失败' });
  }
});

// 拉取最新代码
router.post('/pull', adminAuth, async (req, res) => {
  try {
    exec('git pull origin master', { cwd: ROOT_DIR }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: '拉取代码失败', details: stderr });
      }
      res.json({ message: '代码拉取成功', output: stdout });
    });
  } catch (error) {
    res.status(500).json({ error: '拉取代码失败' });
  }
});

// 安装依赖
router.post('/install', adminAuth, async (req, res) => {
  try {
    exec('npm install --production', { cwd: path.join(ROOT_DIR, 'lobster-circle-backend') }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: '安装依赖失败', details: stderr });
      }
      res.json({ message: '依赖安装成功', output: stdout });
    });
  } catch (error) {
    res.status(500).json({ error: '安装依赖失败' });
  }
});

// 构建项目
router.post('/build', adminAuth, async (req, res) => {
  try {
    exec('npm run build', { cwd: path.join(ROOT_DIR, 'lobster-circle-admin') }, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: '构建失败', details: stderr });
      }
      res.json({ message: '构建成功', output: stdout });
    });
  } catch (error) {
    res.status(500).json({ error: '构建失败' });
  }
});

// 重启服务
router.post('/restart', adminAuth, async (req, res) => {
  try {
    exec('pm2 restart lobster-api && pm2 restart lobster-admin', (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: '重启服务失败', details: stderr });
      }
      res.json({ message: '服务重启成功', output: stdout });
    });
  } catch (error) {
    res.status(500).json({ error: '重启服务失败' });
  }
});

// 版本比较
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

module.exports = router;

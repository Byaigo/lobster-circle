/**
 * 版本检查 API
 */

const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');

// 获取最新版本信息
router.get('/check', async (req, res) => {
  try {
    const { platform = 'all', version = '0.0.0' } = req.query;
    
    const appVersion = await SystemConfig.findOne({ key: 'app_version' });
    const minVersion = await SystemConfig.findOne({ key: 'min_app_version' });
    const announcement = await SystemConfig.findOne({ key: 'announcement' });

    const currentVersion = appVersion?.value || '1.0.0';
    const minimumVersion = minVersion?.value || '1.0.0';

    // 版本比较
    const needsUpdate = compareVersions(currentVersion, version) > 0;
    const forceUpdate = compareVersions(minimumVersion, version) > 0;

    res.json({
      latest: currentVersion,
      minimum: minimumVersion,
      needsUpdate,
      forceUpdate,
      downloadUrl: platform === 'ios' 
        ? 'https://apps.apple.com/app/idxxx' 
        : 'https://play.google.com/store/apps/details?id=com.lobster.circle',
      updateNote: `新版本 ${currentVersion} 已发布，包含多项改进和修复。`,
      announcement: announcement?.value || ''
    });
  } catch (error) {
    res.status(500).json({ error: '获取版本信息失败' });
  }
});

// 版本比较函数
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

// 管理员 - 更新版本
router.put('/version', async (req, res) => {
  try {
    const { version, minVersion, announcement } = req.body;
    
    if (version) {
      await SystemConfig.findOneAndUpdate(
        { key: 'app_version' },
        { key: 'app_version', value: version },
        { upsert: true }
      );
    }
    
    if (minVersion) {
      await SystemConfig.findOneAndUpdate(
        { key: 'min_app_version' },
        { key: 'min_app_version', value: minVersion },
        { upsert: true }
      );
    }
    
    if (announcement !== undefined) {
      await SystemConfig.findOneAndUpdate(
        { key: 'announcement' },
        { key: 'announcement', value: announcement },
        { upsert: true }
      );
    }

    res.json({ message: '版本信息已更新' });
  } catch (error) {
    res.status(500).json({ error: '更新版本失败' });
  }
});

module.exports = router;

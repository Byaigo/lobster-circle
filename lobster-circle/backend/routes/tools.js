/**
 * 工具类 API
 * 隐私设置/免打扰/数据导出
 */

const express = require('express');
const router = express.Router();
const PrivacySettings = require('../models/PrivacySettings');
const DndSettings = require('../models/DndSettings');
const DataExport = require('../models/DataExport');
const auth = require('../middleware/auth');

// ============================================
// 隐私设置
// ============================================

/**
 * GET /api/tools/privacy
 * 获取我的隐私设置
 */
router.get('/privacy', auth, async (req, res) => {
  try {
    const settings = await PrivacySettings.getUserSettings(req.user._id);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取隐私设置失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * PUT /api/tools/privacy
 * 更新隐私设置
 */
router.put('/privacy', auth, async (req, res) => {
  try {
    const settings = await PrivacySettings.getUserSettings(req.user._id);
    
    const { visibility, interaction, discovery, notifications } = req.body;
    
    if (visibility) settings.visibility = { ...settings.visibility, ...visibility };
    if (interaction) settings.interaction = { ...settings.interaction, ...interaction };
    if (discovery) settings.discovery = { ...settings.discovery, ...discovery };
    if (notifications) settings.notifications = { ...settings.notifications, ...notifications };
    
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json({
      success: true,
      data: settings,
      message: '隐私设置已更新'
    });
  } catch (error) {
    console.error('更新隐私设置失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * POST /api/tools/privacy/blacklist/:userId
 * 加入黑名单
 */
router.post('/privacy/blacklist/:userId', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const settings = await PrivacySettings.getUserSettings(req.user._id);
    
    await settings.addToBlacklist(req.params.userId, reason);
    
    res.json({
      success: true,
      message: '已加入黑名单'
    });
  } catch (error) {
    console.error('加入黑名单失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

/**
 * DELETE /api/tools/privacy/blacklist/:userId
 * 移除黑名单
 */
router.delete('/privacy/blacklist/:userId', auth, async (req, res) => {
  try {
    const settings = await PrivacySettings.getUserSettings(req.user._id);
    await settings.removeFromBlacklist(req.params.userId);
    
    res.json({
      success: true,
      message: '已移除黑名单'
    });
  } catch (error) {
    console.error('移除黑名单失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

/**
 * GET /api/tools/privacy/blacklist
 * 获取黑名单列表
 */
router.get('/privacy/blacklist', auth, async (req, res) => {
  try {
    const settings = await PrivacySettings.getUserSettings(req.user._id);
    
    const blacklist = await PrivacySettings.findById(settings._id)
      .populate('blacklist.user', 'nickname avatar');
    
    res.json({
      success: true,
      data: blacklist.blacklist
    });
  } catch (error) {
    console.error('获取黑名单失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

// ============================================
// 免打扰设置
// ============================================

/**
 * GET /api/tools/dnd
 * 获取我的免打扰设置
 */
router.get('/dnd', auth, async (req, res) => {
  try {
    const settings = await DndSettings.getUserDnd(req.user._id);
    
    res.json({
      success: true,
      data: {
        globalDnd: settings.globalDnd,
        scheduledDnd: settings.scheduledDnd,
        userDnd: settings.userDnd,
        groupDnd: settings.groupDnd,
        keywordFilter: settings.keywordFilter,
        pushSettings: settings.pushSettings,
        isDndActive: settings.isDndActive()
      }
    });
  } catch (error) {
    console.error('获取免打扰设置失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * PUT /api/tools/dnd
 * 更新免打扰设置
 */
router.put('/dnd', auth, async (req, res) => {
  try {
    const settings = await DndSettings.getUserDnd(req.user._id);
    
    const { globalDnd, scheduledDnd, keywordFilter, pushSettings } = req.body;
    
    if (globalDnd) settings.globalDnd = { ...settings.globalDnd, ...globalDnd };
    if (scheduledDnd) settings.scheduledDnd = { ...settings.scheduledDnd, ...scheduledDnd };
    if (keywordFilter) settings.keywordFilter = { ...settings.keywordFilter, ...keywordFilter };
    if (pushSettings) settings.pushSettings = { ...settings.pushSettings, ...pushSettings };
    
    settings.updatedAt = new Date();
    await settings.save();
    
    res.json({
      success: true,
      data: settings,
      message: '免打扰设置已更新'
    });
  } catch (error) {
    console.error('更新免打扰设置失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

/**
 * POST /api/tools/dnd/user/:userId
 * 设置用户免打扰
 */
router.post('/dnd/user/:userId', auth, async (req, res) => {
  try {
    const { type = 'mute', muteType = 'all', duration, reason } = req.body;
    const settings = await DndSettings.getUserDnd(req.user._id);
    
    await settings.addUserDnd(req.params.userId, type, muteType, duration, reason);
    
    res.json({
      success: true,
      message: '免打扰设置成功'
    });
  } catch (error) {
    console.error('设置免打扰失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

/**
 * DELETE /api/tools/dnd/user/:userId
 * 移除用户免打扰
 */
router.delete('/dnd/user/:userId', auth, async (req, res) => {
  try {
    const settings = await DndSettings.getUserDnd(req.user._id);
    await settings.removeUserDnd(req.params.userId);
    
    res.json({
      success: true,
      message: '已移除免打扰'
    });
  } catch (error) {
    console.error('移除免打扰失败:', error);
    res.status(500).json({ error: '操作失败' });
  }
});

// ============================================
// 数据导出
// ============================================

/**
 * GET /api/tools/data-export
 * 获取导出记录
 */
router.get('/data-export', auth, async (req, res) => {
  try {
    const exports = await DataExport.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: exports
    });
  } catch (error) {
    console.error('获取导出记录失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * POST /api/tools/data-export
 * 创建导出请求
 */
router.post('/data-export', auth, async (req, res) => {
  try {
    const { exportType = 'all', format = 'json' } = req.body;
    
    const exportJob = await DataExport.createExport(
      req.user._id,
      exportType,
      format
    );
    
    // 异步处理导出
    (async () => {
      try {
        exportJob.status = 'processing';
        await exportJob.save();
        
        // 获取用户数据
        const userData = await DataExport.packageUserData(
          req.user._id,
          exportType
        );
        
        // 生成文件
        const exportDir = path.join(__dirname, '../../exports');
        const filename = `export_${req.user._id}_${Date.now()}.${format}`;
        const filePath = path.join(exportDir, filename);
        
        // 确保目录存在
        const fs = require('fs').promises;
        await fs.mkdir(exportDir, { recursive: true });
        
        // 写入文件
        const content = format === 'json' 
          ? JSON.stringify(userData, null, 2)
          : JSON.stringify(userData);
        
        await fs.writeFile(filePath, content);
        const stats = await fs.stat(filePath);
        
        // 标记完成
        await exportJob.markCompleted(filePath, stats.size);
      } catch (error) {
        await exportJob.markFailed(error);
      }
    })();
    
    res.json({
      success: true,
      data: exportJob,
      message: '导出请求已创建，完成后将通知您'
    });
  } catch (error) {
    console.error('创建导出请求失败:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/tools/data-export/:id/download
 * 下载导出文件
 */
router.get('/data-export/:id/download', auth, async (req, res) => {
  try {
    const exportJob = await DataExport.findById(req.params.id);
    
    if (!exportJob) {
      return res.status(404).json({ error: '导出记录不存在' });
    }
    
    if (exportJob.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限下载' });
    }
    
    if (exportJob.status !== 'completed') {
      return res.status(400).json({ error: '导出尚未完成' });
    }
    
    if (new Date() > exportJob.expiresAt) {
      return res.status(400).json({ error: '导出文件已过期' });
    }
    
    await exportJob.incrementDownload();
    
    const fs = require('fs');
    res.download(exportJob.filePath, `lobster-circle-export.${exportJob.format}`);
  } catch (error) {
    console.error('下载导出文件失败:', error);
    res.status(500).json({ error: '下载失败' });
  }
});

/**
 * DELETE /api/tools/data-export/:id
 * 删除导出记录
 */
router.delete('/data-export/:id', auth, async (req, res) => {
  try {
    const exportJob = await DataExport.findById(req.params.id);
    
    if (!exportJob) {
      return res.status(404).json({ error: '导出记录不存在' });
    }
    
    if (exportJob.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限删除' });
    }
    
    // 删除文件
    const fs = require('fs').promises;
    if (exportJob.filePath) {
      try {
        await fs.unlink(exportJob.filePath);
      } catch (e) {}
    }
    
    await DataExport.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '导出记录已删除'
    });
  } catch (error) {
    console.error('删除导出记录失败:', error);
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;

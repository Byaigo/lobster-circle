/**
 * 缓存管理 API
 */

const express = require('express');
const router = express.Router();
const { clearCache, getCacheStats } = require('../middleware/cache');
const adminAuth = require('../middleware/auth');

// 获取缓存统计
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = getCacheStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ error: '获取缓存统计失败' });
  }
});

// 清除缓存
router.post('/clear', adminAuth, async (req, res) => {
  try {
    const { pattern } = req.body;
    clearCache(pattern);
    res.json({
      success: true,
      message: pattern ? `已清除 ${pattern} 相关缓存` : '已清除所有缓存'
    });
  } catch (error) {
    res.status(500).json({ error: '清除缓存失败' });
  }
});

module.exports = router;

/**
 * 用户标签系统 API
 * 用于用户兴趣标签、内容分类等
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// 获取推荐标签
router.get('/recommendations', auth, async (req, res) => {
  try {
    const allTags = ['🎮 游戏', '🎵 音乐', '🎬 电影', '📚 阅读', '✈️ 旅行', '🍳 美食', '🏃 运动', '🎨 艺术', '💻 科技', '📷 摄影'];
    res.json({ tags: allTags });
  } catch (error) {
    res.status(500).json({ error: '获取标签失败' });
  }
});

// 获取用户标签
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('tags');
    res.json({ tags: user.tags || [] });
  } catch (error) {
    res.status(500).json({ error: '获取标签失败' });
  }
});

// 更新用户标签
router.post('/user', auth, async (req, res) => {
  try {
    const { tags } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      tags: tags.slice(0, 10) // 最多 10 个标签
    });
    res.json({ success: true, tags: tags.slice(0, 10) });
  } catch (error) {
    res.status(500).json({ error: '更新标签失败' });
  }
});

// 根据标签推荐用户
router.get('/users/by-tag', auth, async (req, res) => {
  try {
    const { tag, limit = 20 } = req.query;
    const users = await User.find({
      tags: tag,
      _id: { $ne: req.user.id }
    })
    .select('username avatar bio tags followers')
    .limit(parseInt(limit));
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: '推荐失败' });
  }
});

module.exports = router;

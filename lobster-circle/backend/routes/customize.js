/**
 * 个性化 API
 * 主题/头像框/封面图
 */

const express = require('express');
const router = express.Router();
const Theme = require('../models/Theme');
const { AvatarFrame, UserFrame } = require('../models/AvatarFrame');
const { Cover, UserCover } = require('../models/Cover');
const auth = require('../middleware/auth');

// ============================================
// 主题相关
// ============================================

/**
 * GET /api/customize/themes
 * 获取所有可用主题
 */
router.get('/themes', auth, async (req, res) => {
  try {
    const { type } = req.query; // all | light | dark | premium
    
    let query = { status: 'active' };
    
    if (type === 'light') {
      query.isDark = false;
    } else if (type === 'dark') {
      query.isDark = true;
    } else if (type === 'premium') {
      query.isPremium = true;
    }
    
    const themes = await Theme.find(query).sort({ order: 1, name: 1 });
    
    res.json({
      success: true,
      data: themes
    });
  } catch (error) {
    console.error('获取主题列表失败:', error);
    res.status(500).json({ error: '获取主题失败' });
  }
});

/**
 * GET /api/customize/themes/:key
 * 获取主题详情
 */
router.get('/themes/:key', auth, async (req, res) => {
  try {
    const theme = await Theme.findOne({ key: req.params.key });
    
    if (!theme) {
      return res.status(404).json({ error: '主题不存在' });
    }
    
    res.json({
      success: true,
      data: theme
    });
  } catch (error) {
    console.error('获取主题失败:', error);
    res.status(500).json({ error: '获取主题失败' });
  }
});

/**
 * POST /api/customize/themes/apply
 * 应用主题
 */
router.post('/themes/apply', auth, async (req, res) => {
  try {
    const { themeKey } = req.body;
    
    const theme = await Theme.findOne({ key: themeKey });
    if (!theme) {
      return res.status(404).json({ error: '主题不存在' });
    }
    
    // 检查是否需要付费
    if (theme.isPremium && !req.user.isVip) {
      return res.status(403).json({ error: 'VIP 专属主题' });
    }
    
    // 更新用户主题设置
    req.user.theme = themeKey;
    await req.user.save();
    
    res.json({
      success: true,
      data: theme,
      message: '主题应用成功'
    });
  } catch (error) {
    console.error('应用主题失败:', error);
    res.status(500).json({ error: '应用主题失败' });
  }
});

// ============================================
// 头像框相关
// ============================================

/**
 * GET /api/customize/frames
 * 获取所有头像框
 */
router.get('/frames', auth, async (req, res) => {
  try {
    const { rarity, type } = req.query;
    
    let query = { status: 'active' };
    if (rarity) query.rarity = rarity;
    if (type) query.type = type;
    
    const frames = await AvatarFrame.find(query).sort({ rarity: 1, order: 1 });
    
    // 获取用户已拥有的头像框 ID
    const userFrames = await UserFrame.find({ user: req.user._id });
    const ownedIds = userFrames.map(uf => uf.frame.toString());
    
    const framesWithOwnership = frames.map(frame => ({
      ...frame.toObject(),
      owned: ownedIds.includes(frame._id.toString())
    }));
    
    res.json({
      success: true,
      data: framesWithOwnership
    });
  } catch (error) {
    console.error('获取头像框失败:', error);
    res.status(500).json({ error: '获取头像框失败' });
  }
});

/**
 * GET /api/customize/frames/mine
 * 获取我的头像框
 */
router.get('/frames/mine', auth, async (req, res) => {
  try {
    const userFrames = await UserFrame.getUserFrames(req.user._id);
    
    res.json({
      success: true,
      data: userFrames
    });
  } catch (error) {
    console.error('获取我的头像框失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * POST /api/customize/frames/:id/equip
 * 装备头像框
 */
router.post('/frames/:id/equip', auth, async (req, res) => {
  try {
    const userFrame = await UserFrame.findOne({
      user: req.user._id,
      frame: req.params.id
    });
    
    if (!userFrame) {
      return res.status(404).json({ error: '未拥有该头像框' });
    }
    
    await userFrame.equip();
    
    res.json({
      success: true,
      message: '头像框装备成功'
    });
  } catch (error) {
    console.error('装备头像框失败:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/customize/frames/:id/unlock
 * 解锁头像框
 */
router.post('/frames/:id/unlock', auth, async (req, res) => {
  try {
    const frame = await AvatarFrame.findById(req.params.id);
    if (!frame) {
      return res.status(404).json({ error: '头像框不存在' });
    }
    
    // 检查是否已拥有
    const existing = await UserFrame.findOne({
      user: req.user._id,
      frame: frame._id
    });
    
    if (existing) {
      return res.status(400).json({ error: '已拥有该头像框' });
    }
    
    // 检查价格
    if (frame.isPremium && frame.price > 0) {
      if (req.user.points < frame.price) {
        return res.status(400).json({ error: '积分不足' });
      }
      req.user.points -= frame.price;
      await req.user.save();
    }
    
    // 创建用户头像框
    const userFrame = new UserFrame({
      user: req.user._id,
      frame: frame._id,
      obtainedFrom: 'purchase',
      expiresAt: frame.duration > 0 
        ? new Date(Date.now() + frame.duration * 24 * 60 * 60 * 1000)
        : null
    });
    
    await userFrame.save();
    
    res.json({
      success: true,
      data: userFrame,
      message: '头像框解锁成功'
    });
  } catch (error) {
    console.error('解锁头像框失败:', error);
    res.status(500).json({ error: '解锁失败' });
  }
});

// ============================================
// 封面图相关
// ============================================

/**
 * GET /api/customize/covers
 * 获取所有封面图
 */
router.get('/covers', auth, async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = { status: 'active' };
    if (category) query.category = category;
    
    const covers = await Cover.find(query).sort({ category: 1, order: 1 });
    
    res.json({
      success: true,
      data: covers
    });
  } catch (error) {
    console.error('获取封面图失败:', error);
    res.status(500).json({ error: '获取封面图失败' });
  }
});

/**
 * GET /api/customize/covers/mine
 * 获取我的封面
 */
router.get('/covers/mine', auth, async (req, res) => {
  try {
    const userCover = await UserCover.getUserCover(req.user._id);
    
    res.json({
      success: true,
      data: userCover || null
    });
  } catch (error) {
    console.error('获取我的封面失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * POST /api/customize/covers/:id/set
 * 设置封面
 */
router.post('/covers/:id/set', auth, async (req, res) => {
  try {
    let userCover = await UserCover.findOne({ user: req.user._id });
    
    if (!userCover) {
      userCover = new UserCover({
        user: req.user._id,
        currentCover: req.params.id
      });
    } else {
      await userCover.setCover(req.params.id);
    }
    
    await userCover.save();
    
    res.json({
      success: true,
      data: userCover,
      message: '封面设置成功'
    });
  } catch (error) {
    console.error('设置封面失败:', error);
    res.status(500).json({ error: '设置封面失败' });
  }
});

/**
 * POST /api/customize/covers/upload
 * 上传自定义封面
 */
router.post('/covers/upload', auth, async (req, res) => {
  try {
    const { url, thumbnail } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: '需要提供封面图 URL' });
    }
    
    let userCover = await UserCover.findOne({ user: req.user._id });
    
    if (!userCover) {
      userCover = new UserCover({
        user: req.user._id,
        customCover: {
          url,
          thumbnail: thumbnail || url,
          uploadedAt: new Date()
        }
      });
    } else {
      await userCover.setCustomCover(url, thumbnail);
    }
    
    await userCover.save();
    
    res.json({
      success: true,
      data: userCover,
      message: '封面上传成功'
    });
  } catch (error) {
    console.error('上传封面失败:', error);
    res.status(500).json({ error: '上传封面失败' });
  }
});

module.exports = router;

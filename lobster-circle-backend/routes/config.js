const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');
const OperationLog = require('../models/OperationLog');
const adminAuth = require('./admin');

// 获取所有配置（管理员）
router.get('/', adminAuth, async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category) query.category = category;

    const configs = await SystemConfig.find(query).sort({ category: 1, key: 1 });
    res.json({ configs });
  } catch (error) {
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 获取公开配置（客户端）
router.get('/public', async (req, res) => {
  try {
    const configs = await SystemConfig.find({ isPublic: true });
    const publicConfigs = {};
    configs.forEach(config => {
      publicConfigs[config.key] = config.value;
    });
    res.json({ configs: publicConfigs });
  } catch (error) {
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 更新配置
router.put('/:key', adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    let config = await SystemConfig.findOne({ key });
    
    if (config) {
      config.value = value !== undefined ? value : config.value;
      config.description = description !== undefined ? description : config.description;
      await config.save();
    } else {
      config = await SystemConfig.create({
        key,
        value,
        description,
        category: req.body.category || 'system'
      });
    }

    // 记录操作日志
    await OperationLog.create({
      adminId: req.admin._id,
      action: 'update_config',
      module: 'config',
      targetId: config._id,
      targetType: 'SystemConfig',
      details: { key, value },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: '配置已更新', config });
  } catch (error) {
    res.status(500).json({ error: '更新配置失败' });
  }
});

// 批量初始化默认配置
router.post('/init', adminAuth, async (req, res) => {
  try {
    const defaultConfigs = [
      { key: 'allow_register', value: true, description: '允许新用户注册', category: 'user', isPublic: true },
      { key: 'allow_post', value: true, description: '允许用户发帖', category: 'content', isPublic: true },
      { key: 'allow_comment', value: true, description: '允许用户评论', category: 'content', isPublic: true },
      { key: 'allow_friend_request', value: true, description: '允许发送好友请求', category: 'user', isPublic: true },
      { key: 'allow_private_message', value: true, description: '允许私信', category: 'user', isPublic: true },
      { key: 'maintenance_mode', value: false, description: '维护模式', category: 'system', isPublic: true },
      { key: 'post_review_required', value: false, description: '发帖需要审核', category: 'content', isPublic: false },
      { key: 'max_images_per_post', value: 9, description: '每帖最大图片数', category: 'content', isPublic: true },
      { key: 'max_post_length', value: 1000, description: '帖子最大长度', category: 'content', isPublic: true },
      { key: 'enable_sensitive_word_filter', value: true, description: '启用敏感词过滤', category: 'security', isPublic: false },
      { key: 'enable_report_system', value: true, description: '启用举报系统', category: 'security', isPublic: true },
      { key: 'app_version', value: '1.0.0', description: '当前应用版本', category: 'system', isPublic: true },
      { key: 'min_app_version', value: '1.0.0', description: '最低应用版本', category: 'system', isPublic: true },
      { key: 'announcement', value: '', description: '系统公告', category: 'system', isPublic: true }
    ];

    let updated = 0;
    for (const config of defaultConfigs) {
      const existing = await SystemConfig.findOne({ key: config.key });
      if (!existing) {
        await SystemConfig.create(config);
        updated++;
      }
    }

    res.json({ message: `初始化完成，新增 ${updated} 个配置` });
  } catch (error) {
    res.status(500).json({ error: '初始化配置失败' });
  }
});

module.exports = router;

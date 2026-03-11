const express = require('express');
const router = express.Router();
const SensitiveWord = require('../models/SensitiveWord');
const OperationLog = require('../models/OperationLog');
const adminAuth = require('./admin');

// 获取敏感词列表（管理员）
router.get('/', adminAuth, async (req, res) => {
  try {
    const { category, isActive, search } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.word = { $regex: search, $options: 'i' };

    const words = await SensitiveWord.find(query).sort({ createdAt: -1 });
    res.json({ words });
  } catch (error) {
    res.status(500).json({ error: '获取敏感词失败' });
  }
});

// 添加敏感词
router.post('/', adminAuth, async (req, res) => {
  try {
    const { word, category, level, action, replaceWith } = req.body;

    const existing = await SensitiveWord.findOne({ word });
    if (existing) {
      return res.status(400).json({ error: '敏感词已存在' });
    }

    const sensitiveWord = await SensitiveWord.create({
      word,
      category: category || 'other',
      level: level || 'medium',
      action: action || 'block',
      replaceWith: replaceWith || '***'
    });

    // 记录操作日志
    await OperationLog.create({
      adminId: req.admin._id,
      action: 'add_sensitive_word',
      module: 'security',
      targetId: sensitiveWord._id,
      targetType: 'SensitiveWord',
      details: { word, category },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: '敏感词已添加', word: sensitiveWord });
  } catch (error) {
    res.status(500).json({ error: '添加敏感词失败' });
  }
});

// 批量添加敏感词
router.post('/batch', adminAuth, async (req, res) => {
  try {
    const { words } = req.body; // [{ word, category, level, action }]

    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: '请提供敏感词列表' });
    }

    const existing = await SensitiveWord.find({ word: { $in: words.map(w => w.word) } });
    const existingWords = existing.map(w => w.word);
    const newWords = words.filter(w => !existingWords.includes(w.word));

    if (newWords.length === 0) {
      return res.json({ message: '所有词已存在', added: 0 });
    }

    const inserted = await SensitiveWord.insertMany(newWords);

    // 记录操作日志
    await OperationLog.create({
      adminId: req.admin._id,
      action: 'batch_add_sensitive_words',
      module: 'security',
      details: { count: inserted.length, words: inserted.map(w => w.word) },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: `成功添加 ${inserted.length} 个敏感词`, added: inserted.length });
  } catch (error) {
    res.status(500).json({ error: '批量添加失败' });
  }
});

// 删除敏感词
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const sensitiveWord = await SensitiveWord.findById(req.params.id);
    
    if (!sensitiveWord) {
      return res.status(404).json({ error: '敏感词不存在' });
    }

    await sensitiveWord.deleteOne();

    // 记录操作日志
    await OperationLog.create({
      adminId: req.admin._id,
      action: 'delete_sensitive_word',
      module: 'security',
      targetId: sensitiveWord._id,
      targetType: 'SensitiveWord',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: '敏感词已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

// 启用/禁用敏感词
router.patch('/:id/toggle', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    const sensitiveWord = await SensitiveWord.findById(req.params.id);
    
    if (!sensitiveWord) {
      return res.status(404).json({ error: '敏感词不存在' });
    }

    sensitiveWord.isActive = isActive;
    await sensitiveWord.save();

    // 记录操作日志
    await OperationLog.create({
      adminId: req.admin._id,
      action: 'toggle_sensitive_word',
      module: 'security',
      targetId: sensitiveWord._id,
      targetType: 'SensitiveWord',
      details: { isActive },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: isActive ? '已启用' : '已禁用', word: sensitiveWord });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

module.exports = router;

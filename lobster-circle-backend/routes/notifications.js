/**
 * 通知中心 API
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// 获取通知列表
router.get('/', auth, async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    
    let query = { userId: req.user.id };
    if (type !== 'all') {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .populate('fromUser', 'username avatar')
      .populate('post', 'content')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取通知失败' });
  }
});

// 获取未读通知数量
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: '获取未读数失败' });
  }
});

// 标记单个通知为已读
router.post('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      read: true
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '标记已读失败' });
  }
});

// 全部标记为已读
router.post('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '标记已读失败' });
  }
});

// 删除通知
router.delete('/:id', auth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

// 清空所有通知
router.delete('/all', auth, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '清空失败' });
  }
});

module.exports = router;

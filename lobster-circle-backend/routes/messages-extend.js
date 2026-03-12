/**
 * 消息扩展路由 - 撤回/删除等功能
 * 需要合并到 messages.js 中
 */

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// 撤回消息
router.post('/:id/recall', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }
    
    if (message.from.toString() !== req.user.id) {
      return res.status(403).json({ error: '无权撤回此消息' });
    }
    
    // 只能撤回 2 分钟内的消息
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (message.createdAt < twoMinutesAgo) {
      return res.status(400).json({ error: '只能撤回 2 分钟内的消息' });
    }
    
    message.isRecalled = true;
    message.recalledAt = new Date();
    await message.save();
    
    res.json({ success: true, message: '消息已撤回' });
  } catch (error) {
    res.status(500).json({ error: '撤回失败' });
  }
});

// 删除消息
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }
    
    if (message.from.toString() !== req.user.id && message.to.toString() !== req.user.id) {
      return res.status(403).json({ error: '无权删除此消息' });
    }
    
    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

module.exports = router;

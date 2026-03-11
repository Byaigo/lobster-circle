const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// 获取会话列表
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { from: req.user._id },
            { to: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$to', req.user._id] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // 获取对应用户信息
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.lastMessage.from.toString() === req.user._id.toString()
          ? conv.lastMessage.to
          : conv.lastMessage.from;
        
        const otherUser = await User.findById(otherUserId).select('username avatar isOnline lastSeen');
        
        return {
          conversationId: conv._id,
          otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        };
      })
    );

    res.json({ conversations: conversationsWithUsers });
  } catch (error) {
    res.status(500).json({ error: '获取会话列表失败' });
  }
});

// 获取聊天记录
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const conversationId = Message.getConversationId(req.user._id, req.params.userId);
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('from', 'username avatar')
      .populate('to', 'username avatar');

    // 标记为已读
    await Message.updateMany(
      { conversationId, to: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: '获取聊天记录失败' });
  }
});

// 发送消息
router.post('/send', auth, async (req, res) => {
  try {
    const { to, content, type = 'text', imageUrl } = req.body;

    if (!to || !content) {
      return res.status(400).json({ error: '接收者和内容不能为空' });
    }

    // 检查对方是否存在
    const recipient = await User.findById(to);
    if (!recipient) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 检查是否被拉黑
    if (recipient.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({ error: '你已被对方拉黑' });
    }

    const conversationId = Message.getConversationId(req.user._id, to);

    const message = new Message({
      conversationId,
      from: req.user._id,
      to,
      content,
      type,
      imageUrl
    });

    await message.save();

    // 通过 Socket.io 发送（在 server.js 中处理）
    // io.emit('new_message', message)

    res.json({ message: '消息已发送', data: message });
  } catch (error) {
    res.status(500).json({ error: '发送消息失败' });
  }
});

// 标记消息为已读
router.post('/read', auth, async (req, res) => {
  try {
    const { conversationId } = req.body;

    await Message.updateMany(
      { conversationId, to: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ message: '已标记为已读' });
  } catch (error) {
    res.status(500).json({ error: '标记已读失败' });
  }
});

// 删除消息
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      from: req.user._id
    });

    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }

    await message.deleteOne();
    res.json({ message: '消息已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除消息失败' });
  }
});

module.exports = router;

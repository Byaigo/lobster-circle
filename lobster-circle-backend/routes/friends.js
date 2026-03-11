const express = require('express');
const router = express.Router();
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');

// 发送好友请求
router.post('/request', auth, async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({ error: '不能添加自己为好友' });
    }

    // 检查是否已经是好友
    if (req.user.friends.includes(receiverId)) {
      return res.status(400).json({ error: '已经是好友了' });
    }

    // 检查是否已有待处理请求
    const existingRequest = await FriendRequest.findOne({
      sender: req.user._id,
      receiver: receiverId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ error: '好友请求已发送，等待对方同意' });
    }

    // 创建好友请求
    const friendRequest = new FriendRequest({
      sender: req.user._id,
      receiver: receiverId,
      message
    });
    await friendRequest.save();

    res.json({ message: '好友请求已发送', request: friendRequest });
  } catch (error) {
    console.error('发送好友请求错误:', error);
    res.status(500).json({ error: '发送好友请求失败' });
  }
});

// 获取收到的好友请求
router.get('/requests/received', auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: 'pending'
    }).populate('sender', 'username avatar bio');

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: '获取好友请求失败' });
  }
});

// 获取发出的好友请求
router.get('/requests/sent', auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user._id,
      status: 'pending'
    }).populate('receiver', 'username avatar bio');

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: '获取好友请求失败' });
  }
});

// 同意好友请求
router.post('/requests/:requestId/accept', auth, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findOne({
      _id: req.params.requestId,
      receiver: req.user._id,
      status: 'pending'
    }).populate('sender');

    if (!friendRequest) {
      return res.status(404).json({ error: '好友请求不存在' });
    }

    // 更新请求状态
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // 互相添加为好友
    if (!req.user.friends.includes(friendRequest.sender._id)) {
      req.user.friends.push(friendRequest.sender._id);
      await req.user.save();
    }

    if (!friendRequest.sender.friends.includes(req.user._id)) {
      friendRequest.sender.friends.push(req.user._id);
      await friendRequest.sender.save();
    }

    res.json({ message: '已同意好友请求' });
  } catch (error) {
    res.status(500).json({ error: '处理好友请求失败' });
  }
});

// 拒绝好友请求
router.post('/requests/:requestId/reject', auth, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findOne({
      _id: req.params.requestId,
      receiver: req.user._id,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ error: '好友请求不存在' });
    }

    friendRequest.status = 'rejected';
    await friendRequest.save();

    res.json({ message: '已拒绝好友请求' });
  } catch (error) {
    res.status(500).json({ error: '处理好友请求失败' });
  }
});

// 删除好友
router.delete('/:friendId', auth, async (req, res) => {
  try {
    // 从当前用户的好友列表中移除
    req.user.friends = req.user.friends.filter(
      id => id.toString() !== req.params.friendId
    );
    await req.user.save();

    // 从对方好友列表中移除
    await User.findByIdAndUpdate(req.params.friendId, {
      $pull: { friends: req.user._id }
    });

    res.json({ message: '已删除好友' });
  } catch (error) {
    res.status(500).json({ error: '删除好友失败' });
  }
});

// 获取好友列表
router.get('/list', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username avatar bio isOnline lastSeen');

    res.json({ friends: user.friends });
  } catch (error) {
    res.status(500).json({ error: '获取好友列表失败' });
  }
});

module.exports = router;

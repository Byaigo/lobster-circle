const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// 搜索用户
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }

    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.user._id }
    }).select('username avatar bio followers following isOnline').limit(20);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: '搜索用户失败' });
  }
});

// 获取用户信息
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password -blockedUsers');

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 关注/取消关注
router.post('/:userId/follow', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: '不能关注自己' });
    }

    const isFollowing = req.user.following.includes(targetUser._id);

    if (isFollowing) {
      // 取消关注
      req.user.following = req.user.following.filter(
        id => id.toString() !== targetUser._id.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      // 关注
      req.user.following.push(targetUser._id);
      targetUser.followers.push(req.user._id);
    }

    await req.user.save();
    await targetUser.save();

    res.json({ 
      message: isFollowing ? '已取消关注' : '已关注',
      isFollowing: !isFollowing
    });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

// 拉黑/取消拉黑
router.post('/:userId/block', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const isBlocked = req.user.blockedUsers.includes(targetUser._id);

    if (isBlocked) {
      req.user.blockedUsers = req.user.blockedUsers.filter(
        id => id.toString() !== targetUser._id.toString()
      );
    } else {
      req.user.blockedUsers.push(targetUser._id);
    }

    await req.user.save();

    res.json({ message: isBlocked ? '已取消拉黑' : '已拉黑该用户' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

// 更新个人资料
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, avatar } = req.body;

    if (bio) req.user.bio = bio;
    if (avatar) req.user.avatar = avatar;

    await req.user.save();

    res.json({ message: '资料已更新', user: req.user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: '更新资料失败' });
  }
});

// 获取推荐用户
router.get('/recommendations', auth, async (req, res) => {
  try {
    // 简单推荐：随机推荐非好友用户
    const users = await User.aggregate([
      { $match: { _id: { $ne: req.user._id } } },
      { $sample: { size: 10 } }
    ]);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: '获取推荐失败' });
  }
});

module.exports = router;

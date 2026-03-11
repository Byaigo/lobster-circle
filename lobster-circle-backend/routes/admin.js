const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Notification = require('../models/Notification');

// 管理员认证中间件
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: '未授权' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) return res.status(401).json({ error: '管理员不存在' });

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token 无效' });
  }
};

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: '用户名或密码错误' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: '用户名或密码错误' });

    admin.lastLogin = new Date();
    admin.isOnline = true;
    await admin.save();

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      message: '登录成功',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取后台首页统计
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [
      userCount,
      postCount,
      reportCount,
      onlineUsers
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isOnline: true })
    ]);

    // 最近 7 天新增用户
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    res.json({
      stats: {
        users: userCount,
        posts: postCount,
        pendingReports: reportCount,
        onlineUsers,
        newUsersThisWeek: newUsers
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 用户管理 - 列表
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    
    let query = {};
    if (search) query.username = { $regex: search, $options: 'i' };
    if (status === 'banned') query.isBanned = true;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 用户管理 - 封禁/解封
router.post('/users/:userId/ban', adminAuth, async (req, res) => {
  try {
    const { isBanned, reason } = req.body;
    
    if (!req.admin.permissions.banUser) {
      return res.status(403).json({ error: '无权限' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    user.isBanned = isBanned;
    user.banReason = reason;
    if (isBanned) {
      user.bannedAt = new Date();
      user.bannedBy = req.admin._id;
    }
    await user.save();

    // 发送通知
    if (isBanned) {
      await Notification.create({
        userId: user._id,
        type: 'system',
        message: `您的账号已被封禁，原因：${reason}`,
        actionUrl: '/settings'
      });
    }

    res.json({ message: isBanned ? '已封禁用户' : '已解封用户' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

// 用户管理 - 修改用户信息
router.put('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { username, avatar, bio } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    if (username) user.username = username;
    if (avatar) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({ message: '用户信息已更新', user: user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

// 用户管理 - 重置密码
router.post('/users/:userId/reset-password', adminAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: '密码至少 6 个字符' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const bcrypt = require('bcryptjs');
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // 发送通知
    await Notification.create({
      userId: user._id,
      type: 'system',
      message: '您的密码已被管理员重置，请及时修改',
      actionUrl: '/settings'
    });

    res.json({ message: '密码已重置' });
  } catch (error) {
    res.status(500).json({ error: '重置密码失败' });
  }
});

// 内容审核 - 动态列表
router.get('/posts', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = {};
    if (status === 'reported') {
      // 获取被举报的动态
      const reportedPosts = await Report.find({ targetType: 'post' }).distinct('targetId');
      query._id = { $in: reportedPosts };
    }

    const posts = await Post.find(query)
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: '获取动态列表失败' });
  }
});

// 内容审核 - 删除动态
router.delete('/posts/:postId', adminAuth, async (req, res) => {
  try {
    if (!req.admin.permissions.deletePost) {
      return res.status(403).json({ error: '无权限' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: '动态不存在' });

    await post.deleteOne();

    // 通知用户
    await Notification.create({
      userId: post.userId,
      type: 'system',
      message: '您的动态因违规已被删除',
      actionUrl: '/profile'
    });

    res.json({ message: '动态已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

// 举报管理 - 列表
router.get('/reports', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('reporter', 'username avatar')
      .populate('targetId')
      .populate('handledBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: '获取举报列表失败' });
  }
});

// 举报管理 - 处理
router.post('/reports/:reportId/handle', adminAuth, async (req, res) => {
  try {
    const { status, note, action } = req.body;
    
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ error: '举报不存在' });

    report.status = status;
    report.handleNote = note;
    report.handledBy = req.admin._id;
    report.handledAt = new Date();
    await report.save();

    // 如果采取行动
    if (action === 'delete_post' && report.targetType === 'post') {
      await Post.findByIdAndDelete(report.targetId);
    }

    res.json({ message: '举报已处理' });
  } catch (error) {
    res.status(500).json({ error: '处理失败' });
  }
});

module.exports = router;

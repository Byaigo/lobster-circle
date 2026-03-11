/**
 * 登录日志 API
 */

const express = require('express');
const router = express.Router();
const LoginLog = require('../models/LoginLog');
const User = require('../models/User');
const auth = require('../middleware/auth');

// 获取用户登录日志（管理员）
router.get('/', auth, async (req, res) => {
  try {
    const { userId, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (userId) query.userId = userId;

    const logs = await LoginLog.find(query)
      .populate('userId', 'username avatar')
      .sort({ loginAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LoginLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: '获取登录日志失败' });
  }
});

// 获取我的登录日志
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const logs = await LoginLog.find({ userId: req.user._id })
      .sort({ loginAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LoginLog.countDocuments({ userId: req.user._id });

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: '获取登录日志失败' });
  }
});

// 获取登录统计（管理员）
router.get('/stats', auth, async (req, res) => {
  try {
    // 今日登录数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await LoginLog.countDocuments({
      loginAt: { $gte: today },
      status: 'success'
    });

    // 本周登录数
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekCount = await LoginLog.countDocuments({
      loginAt: { $gte: weekAgo },
      status: 'success'
    });

    // 本月登录数
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthCount = await LoginLog.countDocuments({
      loginAt: { $gte: monthAgo },
      status: 'success'
    });

    // 登录失败数
    const failCount = await LoginLog.countDocuments({ status: 'failed' });

    // 设备分布
    const deviceStats = await LoginLog.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$device', count: { $sum: 1 } } }
    ]);

    res.json({
      today: todayCount,
      week: weekCount,
      month: monthCount,
      failed: failCount,
      devices: deviceStats
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

module.exports = router;

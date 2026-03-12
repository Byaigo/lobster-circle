/**
 * 签到系统 API
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');

// 获取签到状态
router.get('/status', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 检查今天是否已签到
    const todayCheckIn = await CheckIn.findOne({
      userId: req.user.id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // 获取连续签到天数
    const checkInRecords = await CheckIn.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);

    let continuousDays = 0;
    if (checkInRecords.length > 0) {
      continuousDays = calculateContinuousDays(checkInRecords);
    }

    // 获取总积分
    const totalPoints = checkInRecords.reduce((sum, record) => sum + record.points, 0);

    res.json({
      checkedInToday: !!todayCheckIn,
      streak: continuousDays,
      points: totalPoints,
      todayPoints: todayCheckIn?.points || 0
    });
  } catch (error) {
    res.status(500).json({ error: '获取签到状态失败' });
  }
});

// 执行签到
router.post('/do', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 检查今天是否已签到
    const todayCheckIn = await CheckIn.findOne({
      userId: req.user.id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (todayCheckIn) {
      return res.status(400).json({ error: '今天已经签到过了' });
    }

    // 计算连续签到天数
    const checkInRecords = await CheckIn.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30);

    let continuousDays = calculateContinuousDays(checkInRecords);
    continuousDays += 1; // 今天签到后

    // 计算奖励积分（连续签到越多奖励越多）
    let points = 10; // 基础积分
    if (continuousDays >= 30) points = 50;
    else if (continuousDays >= 14) points = 30;
    else if (continuousDays >= 7) points = 20;

    // 创建签到记录
    const checkIn = new CheckIn({
      userId: req.user.id,
      points,
      continuousDays
    });

    await checkIn.save();

    // 更新用户积分
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { points }
    });

    res.json({
      success: true,
      points,
      continuousDays,
      message: `签到成功！获得 ${points} 积分`
    });
  } catch (error) {
    res.status(500).json({ error: '签到失败' });
  }
});

// 获取签到历史
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    
    const checkInRecords = await CheckIn.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await CheckIn.countDocuments({ userId: req.user.id });

    // 统计数据
    const totalDays = total;
    const continuousDays = calculateContinuousDays(checkInRecords);
    const totalPoints = checkInRecords.reduce((sum, record) => sum + record.points, 0);

    res.json({
      history: checkInRecords,
      totalDays,
      continuousDays,
      totalPoints,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取签到历史失败' });
  }
});

// 获取签到统计
router.get('/stats', auth, async (req, res) => {
  try {
    const checkInRecords = await CheckIn.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(365);

    const totalDays = checkInRecords.length;
    const continuousDays = calculateContinuousDays(checkInRecords);
    const totalPoints = checkInRecords.reduce((sum, record) => sum + record.points, 0);

    // 按月统计
    const monthlyStats = {};
    checkInRecords.forEach(record => {
      const month = new Date(record.createdAt).toISOString().slice(0, 7);
      if (!monthlyStats[month]) {
        monthlyStats[month] = { days: 0, points: 0 };
      }
      monthlyStats[month].days += 1;
      monthlyStats[month].points += record.points;
    });

    res.json({
      totalDays,
      continuousDays,
      totalPoints,
      monthlyStats
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 计算连续签到天数
function calculateContinuousDays(records) {
  if (records.length === 0) return 0;

  let continuous = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 检查最后一次签到是否是今天或昨天
  const lastCheckIn = new Date(records[0].createdAt);
  lastCheckIn.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((today - lastCheckIn) / (1000 * 60 * 60 * 24));
  
  // 如果最后一次签到超过昨天，连续中断
  if (diffDays > 1) return 0;

  // 计算连续天数
  for (let i = 1; i < records.length; i++) {
    const prevDate = new Date(records[i - 1].createdAt);
    const currDate = new Date(records[i].createdAt);
    
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
    
    if (diff === 1) {
      continuous++;
    } else if (diff > 1) {
      break; // 连续中断
    }
  }

  return continuous;
}

module.exports = router;

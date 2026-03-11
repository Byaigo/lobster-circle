/**
 * 数据分析 API
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const adminAuth = require('./admin');

// 获取基础统计
router.get('/basic', adminAuth, async (req, res) => {
  try {
    const stats = await analyticsService.getBasicStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: '获取统计失败' });
  }
});

// 获取用户增长趋势
router.get('/user-growth', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trend = await analyticsService.getUserGrowthTrend(parseInt(days));
    res.json({ trend });
  } catch (error) {
    res.status(500).json({ error: '获取趋势失败' });
  }
});

// 获取动态发布趋势
router.get('/post-growth', adminAuth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trend = await analyticsService.getPostGrowthTrend(parseInt(days));
    res.json({ trend });
  } catch (error) {
    res.status(500).json({ error: '获取趋势失败' });
  }
});

// 获取活跃用户统计
router.get('/active-users', adminAuth, async (req, res) => {
  try {
    const data = await analyticsService.getActiveUsers();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 获取签到统计
router.get('/checkin', adminAuth, async (req, res) => {
  try {
    const stats = await analyticsService.getCheckInStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 获取内容统计
router.get('/content', adminAuth, async (req, res) => {
  try {
    const stats = await analyticsService.getContentStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 获取完整分析报告
router.get('/full-report', adminAuth, async (req, res) => {
  try {
    const report = await analyticsService.getFullReport();
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: '获取报告失败' });
  }
});

module.exports = router;

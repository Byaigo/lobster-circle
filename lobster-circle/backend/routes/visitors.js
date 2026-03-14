/**
 * 访客记录 API
 * 查看谁访问了我的主页
 */

const express = require('express');
const router = express.Router();
const VisitRecord = require('../models/VisitRecord');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * GET /api/visitors
 * 获取我的访客列表
 */
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type = 'profile' } = req.query;
    
    const result = await VisitRecord.getVisitors(
      req.user._id,
      parseInt(page),
      parseInt(limit)
    );
    
    // 处理匿名访客
    const visitors = result.records.map(record => ({
      ...record.toObject(),
      visitor: record.anonymous ? {
        _id: 'anonymous',
        nickname: '神秘访客',
        avatar: '',
        isAnonymous: true
      } : record.visitor,
      isRead: record.isRead
    }));
    
    res.json({
      success: true,
      data: visitors,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('获取访客列表失败:', error);
    res.status(500).json({ error: '获取访客列表失败' });
  }
});

/**
 * GET /api/visitors/unread-count
 * 获取未读访客数量
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await VisitRecord.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('获取未读数量失败:', error);
    res.status(500).json({ error: '获取未读数量失败' });
  }
});

/**
 * POST /api/visitors/mark-read
 * 标记访客为已读
 */
router.post('/mark-read', auth, async (req, res) => {
  try {
    const { visitorIds } = req.body;
    
    const count = await VisitRecord.markAsRead(req.user._id, visitorIds);
    
    res.json({
      success: true,
      data: { markedCount: count },
      message: '标记成功'
    });
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json({ error: '标记已读失败' });
  }
});

/**
 * GET /api/visitors/visited
 * 获取我访问过的人
 */
router.get('/visited', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await VisitRecord.getVisitedUsers(
      req.user._id,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: result.records,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    console.error('获取访问记录失败:', error);
    res.status(500).json({ error: '获取访问记录失败' });
  }
});

/**
 * POST /api/visitors/record
 * 手动记录访问（用于前端主动上报）
 */
router.post('/record', auth, async (req, res) => {
  try {
    const { visitedUserId, type = 'profile', details = {} } = req.body;
    
    if (!visitedUserId) {
      return res.status(400).json({ error: '需要提供被访问用户 ID' });
    }
    
    // 不能访问自己
    if (visitedUserId === req.user._id.toString()) {
      return res.json({
        success: true,
        message: '无需记录访问自己'
      });
    }
    
    const record = await VisitRecord.recordVisit(
      req.user._id,
      visitedUserId,
      type,
      details
    );
    
    res.json({
      success: true,
      data: record,
      message: '访问记录成功'
    });
  } catch (error) {
    console.error('记录访问失败:', error);
    res.status(500).json({ error: '记录访问失败' });
  }
});

/**
 * GET /api/visitors/stats
 * 获取访客统计
 */
router.get('/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // 今日访客数
    const todayCount = await VisitRecord.countDocuments({
      visited: req.user._id,
      createdAt: { $gte: today }
    });
    
    // 本周访客数
    const weekCount = await VisitRecord.countDocuments({
      visited: req.user._id,
      createdAt: { $gte: weekAgo }
    });
    
    // 总访客数（去重）
    const totalVisitors = await VisitRecord.distinct('visitor', {
      visited: req.user._id
    });
    
    // 未读数
    const unreadCount = await VisitRecord.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      data: {
        today: todayCount,
        thisWeek: weekCount,
        total: totalVisitors.length,
        unread: unreadCount
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '获取统计失败' });
  }
});

module.exports = router;

/**
 * 互动娱乐 API
 * 等级/成就/抽奖
 */

const express = require('express');
const router = express.Router();
const UserLevel = require('../models/UserLevel');
const { Achievement, UserAchievement } = require('../models/Achievement');
const { Lottery, LotteryRecord } = require('../models/Lottery');
const auth = require('../middleware/auth');

// ============================================
// 等级系统
// ============================================

/**
 * GET /api/level/me
 * 获取我的等级信息
 */
router.get('/level/me', auth, async (req, res) => {
  try {
    let userLevel = await UserLevel.findOne({ user: req.user._id })
      .populate('user', 'nickname avatar');
    
    if (!userLevel) {
      userLevel = new UserLevel({
        user: req.user._id,
        level: 1,
        exp: 0,
        totalExp: 0,
        title: '新手龙虾'
      });
      await userLevel.save();
    }
    
    const expToNext = userLevel.getExpToNextLevel();
    
    res.json({
      success: true,
      data: {
        level: userLevel.level,
        exp: userLevel.exp,
        totalExp: userLevel.totalExp,
        todayExp: userLevel.todayExp,
        dailyLimit: UserLevel.getLevelConfig().dailyExpLimit,
        progress: userLevel.levelProgress,
        title: userLevel.title,
        expToNext,
        nextLevelTitle: userLevel.getLevelTitle(userLevel.level + 1)
      }
    });
  } catch (error) {
    console.error('获取等级信息失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * GET /api/level/leaderboard
 * 等级排行榜
 */
router.get('/level/leaderboard', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const result = await UserLevel.getLeaderboard(parseInt(page), parseInt(limit));
    
    // 获取自己的排名
    const myLevel = await UserLevel.findOne({ user: req.user._id });
    let myRank = null;
    if (myLevel) {
      const betterUsers = await UserLevel.countDocuments({
        $or: [
          { level: { $gt: myLevel.level } },
          { level: myLevel.level, totalExp: { $gt: myLevel.totalExp } }
        ]
      });
      myRank = betterUsers + 1;
    }
    
    res.json({
      success: true,
      data: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      },
      myRank
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    res.status(500).json({ error: '获取排行榜失败' });
  }
});

// ============================================
// 成就系统
// ============================================

/**
 * GET /api/achievements
 * 获取所有成就
 */
router.get('/achievements', auth, async (req, res) => {
  try {
    const { category, rarity } = req.query;
    
    let query = { status: 'active' };
    if (category) query.category = category;
    if (rarity) query.rarity = rarity;
    
    const achievements = await Achievement.find(query)
      .sort({ category: 1, rarity: 1, order: 1 });
    
    // 获取用户已完成的成就
    const userAchievements = await UserAchievement.find({ user: req.user._id });
    const completedIds = userAchievements
      .filter(ua => ua.progress.completed)
      .map(ua => ua.achievement.toString());
    
    const achievementsWithProgress = achievements.map(ach => {
      const userAch = userAchievements.find(
        ua => ua.achievement.toString() === ach._id.toString()
      );
      
      return {
        ...ach.toObject(),
        completed: completedIds.includes(ach._id.toString()),
        progress: userAch ? userAch.progress : null,
        achievedAt: userAch ? userAch.achievedAt : null
      };
    });
    
    res.json({
      success: true,
      data: achievementsWithProgress
    });
  } catch (error) {
    console.error('获取成就列表失败:', error);
    res.status(500).json({ error: '获取成就失败' });
  }
});

/**
 * GET /api/achievements/mine
 * 获取我的成就
 */
router.get('/achievements/mine', auth, async (req, res) => {
  try {
    const userAchievements = await UserAchievement.getUserAchievements(req.user._id);
    
    const completed = userAchievements.filter(ua => ua.progress.completed);
    const inProgress = userAchievements.filter(ua => !ua.progress.completed);
    
    res.json({
      success: true,
      data: {
        completed,
        inProgress,
        total: userAchievements.length,
        completedCount: completed.length
      }
    });
  } catch (error) {
    console.error('获取我的成就失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * POST /api/achievements/:key/progress
 * 更新成就进度
 */
router.post('/achievements/:key/progress', auth, async (req, res) => {
  try {
    const { currentValue } = req.body;
    
    const userAch = await UserAchievement.getUserProgress(
      req.user._id,
      req.params.key
    );
    
    if (!userAch) {
      return res.status(404).json({ error: '成就不存在' });
    }
    
    const completed = await userAch.updateProgress(currentValue);
    
    if (completed && !userAch.achievedAt) {
      // 达成成就，发放奖励
      const achievement = await Achievement.findById(userAch.achievement);
      
      if (achievement.reward.exp > 0) {
        const UserLevel = require('../models/UserLevel');
        let userLevel = await UserLevel.findOne({ user: req.user._id });
        if (!userLevel) {
          userLevel = new UserLevel({ user: req.user._id });
        }
        await userLevel.addExp(achievement.reward.exp);
      }
      
      if (achievement.reward.points > 0) {
        req.user.points += achievement.reward.points;
        await req.user.save();
      }
    }
    
    res.json({
      success: true,
      data: userAch.progress,
      completed
    });
  } catch (error) {
    console.error('更新成就进度失败:', error);
    res.status(500).json({ error: '更新失败' });
  }
});

// ============================================
// 抽奖系统
// ============================================

/**
 * GET /api/lottery
 * 获取抽奖活动列表
 */
router.get('/lottery', auth, async (req, res) => {
  try {
    const lotteries = await Lottery.getActiveLotteries();
    
    res.json({
      success: true,
      data: lotteries
    });
  } catch (error) {
    console.error('获取抽奖活动失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * GET /api/lottery/:id
 * 获取抽奖活动详情
 */
router.get('/lottery/:id', auth, async (req, res) => {
  try {
    const lottery = await Lottery.findById(req.params.id);
    
    if (!lottery) {
      return res.status(404).json({ error: '活动不存在' });
    }
    
    // 获取用户今日免费次数
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const freeDraws = await LotteryRecord.countDocuments({
      user: req.user._id,
      lottery: lottery._id,
      isFree: true,
      drawnAt: { $gte: todayStart }
    });
    
    res.json({
      success: true,
      data: {
        ...lottery.toObject(),
        freeDrawsUsed: freeDraws,
        freeDrawsRemaining: lottery.freeDaily - freeDraws
      }
    });
  } catch (error) {
    console.error('获取抽奖详情失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

/**
 * POST /api/lottery/:id/draw
 * 抽奖
 */
router.post('/lottery/:id/draw', auth, async (req, res) => {
  try {
    const { isFree } = req.body;
    
    const lottery = await Lottery.findById(req.params.id);
    if (!lottery) {
      return res.status(404).json({ error: '活动不存在' });
    }
    
    const result = await lottery.draw(req.user, isFree);
    
    res.json({
      success: true,
      data: result,
      message: `恭喜获得：${result.prize.name}`
    });
  } catch (error) {
    console.error('抽奖失败:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/lottery/records
 * 获取我的抽奖记录
 */
router.get('/lottery/records', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const records = await LotteryRecord.find({ user: req.user._id })
      .populate('lottery', 'name banner')
      .sort({ drawnAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await LotteryRecord.countDocuments({ user: req.user._id });
    
    res.json({
      success: true,
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取抽奖记录失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

module.exports = router;

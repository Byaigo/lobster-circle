/**
 * 数据统计服务
 */

const User = require('../models/User');
const Post = require('../models/Post');
const Message = require('../models/Message');
const CheckIn = require('../models/CheckIn');

class AnalyticsService {
  // 获取基础统计
  async getBasicStats() {
    const [
      totalUsers,
      totalPosts,
      totalMessages,
      onlineUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ isOnline: true }),
      this.getNewUsersCount(1),
      this.getNewUsersCount(7),
      this.getNewUsersCount(30)
    ]);

    return {
      users: {
        total: totalUsers,
        online: onlineUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth
      },
      posts: {
        total: totalPosts
      },
      messages: {
        total: totalMessages
      }
    };
  }

  // 获取指定天数的新增用户
  async getNewUsersCount(days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return await User.countDocuments({
      createdAt: { $gte: startDate }
    });
  }

  // 获取用户增长趋势（最近 30 天）
  async getUserGrowthTrend(days = 30) {
    const trend = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await User.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
      
      trend.push({
        date: date.toISOString().split('T')[0],
        users: count
      });
    }
    
    return trend;
  }

  // 获取动态发布趋势
  async getPostGrowthTrend(days = 30) {
    const trend = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await Post.countDocuments({
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
      
      trend.push({
        date: date.toISOString().split('T')[0],
        posts: count
      });
    }
    
    return trend;
  }

  // 获取活跃用户统计（DAU/MAU）
  async getActiveUsers() {
    const now = new Date();
    
    // DAU - 今天有操作的用户
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const dau = await User.countDocuments({
      lastSeen: { $gte: todayStart }
    });
    
    // WAU - 7 天内有操作的用户
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const wau = await User.countDocuments({
      lastSeen: { $gte: weekAgo }
    });
    
    // MAU - 30 天内有操作的用户
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const mau = await User.countDocuments({
      lastSeen: { $gte: monthAgo }
    });
    
    return {
      dau,
      wau,
      mau,
      dauWauRatio: dau / wau || 0,
      dauMauRatio: dau / mau || 0
    };
  }

  // 获取签到统计
  async getCheckInStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayCheckIns = await CheckIn.countDocuments({ date: today });
    
    // 平均连续签到天数
    const avgStreak = await CheckIn.aggregate([
      { $group: { _id: null, avg: { $avg: '$streak' } } }
    ]);
    
    return {
      todayCheckIns,
      avgStreak: avgStreak[0]?.avg || 0
    };
  }

  // 获取内容统计
  async getContentStats() {
    const totalPosts = await Post.countDocuments();
    const totalLikes = await Post.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$likes' } } } }
    ]);
    const totalComments = await Post.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$comments' } } } }
    ]);
    
    return {
      totalPosts,
      totalLikes: totalLikes[0]?.total || 0,
      totalComments: totalComments[0]?.total || 0,
      avgLikesPerPost: totalLikes[0]?.total / totalPosts || 0,
      avgCommentsPerPost: totalComments[0]?.total / totalPosts || 0
    };
  }

  // 获取完整分析报告
  async getFullReport() {
    const [
      basicStats,
      userGrowth,
      postGrowth,
      activeUsers,
      checkInStats,
      contentStats
    ] = await Promise.all([
      this.getBasicStats(),
      this.getUserGrowthTrend(),
      this.getPostGrowthTrend(),
      this.getActiveUsers(),
      this.getCheckInStats(),
      this.getContentStats()
    ]);
    
    return {
      basicStats,
      trends: {
        userGrowth,
        postGrowth
      },
      activeUsers,
      checkInStats,
      contentStats
    };
  }
}

module.exports = new AnalyticsService();

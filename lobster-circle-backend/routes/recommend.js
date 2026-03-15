/**
 * 推荐 API 路由
 * 
 * GET /api/recommend/users   - 推荐用户
 * GET /api/recommend/posts   - 推荐动态
 * GET /api/search/hot        - 热搜榜单
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

/**
 * 推荐用户
 * 
 * 策略：
 * - hot: 按粉丝数排序
 * - new: 按注册时间排序（新人）
 * - nearby: 按地理位置（待实现）
 */
router.get('/users', auth.optional, async (req, res) => {
  try {
    const {
      type = 'hot',
      limit = 20,
      page = 1,
    } = req.query;

    const query = {};
    
    // 排除自己和已关注的用户
    if (req.user) {
      query._id = { $ne: req.user._id };
      query._id = { $nin: req.user.following || [] };
    }

    let sort = {};
    if (type === 'hot') {
      sort = { followers: -1 };
    } else if (type === 'new') {
      sort = { createdAt: -1 };
    }

    const users = await User.find(query)
      .select('username avatar bio followers following createdAt')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const hasMore = users.length === parseInt(limit);

    // 检查是否已关注
    const usersWithFollow = users.map(user => {
      const userObj = user.toObject();
      userObj.isFollowing = req.user && req.user.following?.includes(user._id.toString());
      return userObj;
    });

    res.json({
      success: true,
      data: {
        users: usersWithFollow,
        hasMore,
      },
    });
  } catch (error) {
    console.error('[Recommend API] 推荐用户失败:', error);
    res.status(500).json({
      success: false,
      message: '推荐用户失败',
    });
  }
});

/**
 * 推荐动态
 * 
 * 策略：
 * - hot: 按点赞数 + 评论数排序（热度算法）
 * - latest: 按时间排序（最新）
 * - following: 只关注的人（已在 feed 接口实现）
 */
router.get('/posts', auth.optional, async (req, res) => {
  try {
    const {
      type = 'hot',
      limit = 20,
      page = 1,
    } = req.query;

    const query = { visibility: 'public' };
    let sort = {};

    if (type === 'hot') {
      // 热度算法：点赞数 * 2 + 评论数 * 3 + 时间衰减
      const posts = await Post.find(query)
        .populate('userId', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) * 3)
        .skip((parseInt(page) - 1) * parseInt(limit) * 3);

      // 计算热度分数
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      
      const postsWithScore = posts.map(post => {
        const likeCount = post.likes?.length || 0;
        const commentCount = post.comments?.length || 0;
        const favoriteCount = post.favorites?.length || 0;
        
        // 时间衰减：越新分数越高
        const age = now - new Date(post.createdAt).getTime();
        const timeDecay = Math.exp(-age / oneDay);
        
        // 热度分数
        const score = (likeCount * 2 + commentCount * 3 + favoriteCount * 1.5) * timeDecay;
        
        return {
          ...post.toObject(),
          likeCount,
          commentCount,
          favoriteCount,
          score,
        };
      });

      // 按热度排序
      postsWithScore.sort((a, b) => b.score - a.score);
      
      // 分页
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const paginatedPosts = postsWithScore.slice(startIndex, startIndex + parseInt(limit));

      res.json({
        success: true,
        data: {
          posts: paginatedPosts,
          hasMore: startIndex + parseInt(limit) < postsWithScore.length,
        },
      });
    } else if (type === 'latest') {
      const posts = await Post.find(query)
        .populate('userId', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const postsWithCount = posts.map(post => ({
        ...post.toObject(),
        likeCount: post.likes?.length || 0,
        commentCount: post.comments?.length || 0,
        favoriteCount: post.favorites?.length || 0,
      }));

      res.json({
        success: true,
        data: {
          posts: postsWithCount,
          hasMore: posts.length === parseInt(limit),
        },
      });
    }
  } catch (error) {
    console.error('[Recommend API] 推荐动态失败:', error);
    res.status(500).json({
      success: false,
      message: '推荐动态失败',
    });
  }
});

/**
 * 热搜榜单
 * 
 * 从话题标签中统计热度
 */
router.get('/hot', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // 计算时间范围
    const now = Date.now();
    let startTime;
    switch (timeRange) {
      case '1h': startTime = now - 3600000; break;
      case '24h': startTime = now - 86400000; break;
      case '7d': startTime = now - 604800000; break;
      default: startTime = now - 86400000;
    }

    // 统计话题标签
    const posts = await Post.find({
      visibility: 'public',
      createdAt: { $gte: new Date(startTime) },
      hashtags: { $exists: true, $ne: [] },
    })
      .select('hashtags')
      .lean();

    // 统计每个标签的出现次数
    const hashtagCount = {};
    posts.forEach(post => {
      (post.hashtags || []).forEach(tag => {
        hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
      });
    });

    // 转换为数组并排序
    const hashtags = Object.entries(hashtagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    res.json({
      success: true,
      data: {
        hashtags,
        timeRange,
      },
    });
  } catch (error) {
    console.error('[Recommend API] 热搜榜单失败:', error);
    res.status(500).json({
      success: false,
      message: '热搜榜单失败',
    });
  }
});

module.exports = router;

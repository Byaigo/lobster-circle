/**
 * 全局搜索 API
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

// 综合搜索
router.get('/', auth, async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: { message: '搜索关键词不能为空' }
      });
    }

    let results = {};

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        username: { $regex: q, $options: 'i' },
        isDeleted: false
      })
      .select('username avatar bio followers following')
      .limit(20);
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        $or: [
          { content: { $regex: q, $options: 'i' } },
          { hashtags: { $regex: q, $options: 'i' } }
        ],
        visibility: 'public'
      })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);
    }

    res.json({
      success: true,
      data: results,
      query: q,
      type
    });
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// 搜索用户
router.get('/users', auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: { message: '搜索关键词不能为空' }
      });
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      isDeleted: false
    })
    .select('username avatar bio followers following')
    .limit(limit);

    res.json({
      success: true,
      data: { users },
      query: q
    });
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// 搜索动态
router.get('/posts', auth, async (req, res) => {
  try {
    const { q, hashtag, page = 1, limit = 20 } = req.query;
    
    let query = { visibility: 'public' };

    if (hashtag) {
      query.hashtags = { $regex: hashtag, $options: 'i' };
    } else if (q) {
      query.$or = [
        { content: { $regex: q, $options: 'i' } },
        { hashtags: { $regex: q, $options: 'i' } }
      ];
    } else {
      return res.status(400).json({
        success: false,
        error: { message: '请提供搜索关键词或话题标签' }
      });
    }

    const posts = await Post.find(query)
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: { posts },
      query: q || hashtag
    });
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// 热搜榜单
router.get('/trending', auth, async (req, res) => {
  try {
    // 获取热门话题标签
    const trendingHashtags = await Post.aggregate([
      { $match: { visibility: 'public' } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        trending: trendingHashtags.map(h => ({
          tag: h._id,
          count: h.count
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取热搜失败' });
  }
});

module.exports = router;

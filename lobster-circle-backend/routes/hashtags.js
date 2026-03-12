/**
 * 话题标签 API
 * 支持热门话题、标签页等
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');

// 获取热门话题
router.get('/trending', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const trendingHashtags = await Post.aggregate([
      { $match: { visibility: 'public' } },
      { $unwind: '$hashtags' },
      { $group: { 
        _id: '$hashtags', 
        count: { $sum: 1 },
        recentPosts: { $push: '$$ROOT' }
      }},
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const result = trendingHashtags.map(item => ({
      tag: item._id,
      count: item.count,
      recentPostCount: item.recentPosts.length
    }));

    res.json({ hashtags: result });
  } catch (error) {
    res.status(500).json({ error: '获取热门话题失败' });
  }
});

// 获取标签下的动态
router.get('/:tag/posts', auth, async (req, res) => {
  try {
    const { tag } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const posts = await Post.find({
      hashtags: { $regex: new RegExp(tag.replace('#', ''), 'i') },
      visibility: 'public'
    })
    .populate('userId', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Post.countDocuments({
      hashtags: { $regex: new RegExp(tag.replace('#', ''), 'i') },
      visibility: 'public'
    });

    res.json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取动态失败' });
  }
});

// 搜索话题
router.get('/search', auth, async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: '请提供搜索关键词' });
    }

    const hashtags = await Post.aggregate([
      { $match: { visibility: 'public' } },
      { $unwind: '$hashtags' },
      { $match: { hashtags: { $regex: new RegExp(q, 'i') } } },
      { $group: { _id: '$hashtags', count: { $sum: 1 } }},
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const result = hashtags.map(item => ({
      tag: item._id,
      count: item.count
    }));

    res.json({ hashtags: result });
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// 获取用户常使用的标签
router.get('/user/:userId/frequent', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;
    
    const hashtags = await Post.aggregate([
      { $match: { userId: require('mongoose').Types.ObjectId(userId), visibility: 'public' } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } }},
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const result = hashtags.map(item => ({
      tag: item._id,
      count: item.count
    }));

    res.json({ hashtags: result });
  } catch (error) {
    res.status(500).json({ error: '获取失败' });
  }
});

module.exports = router;

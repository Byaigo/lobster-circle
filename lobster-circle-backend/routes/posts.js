const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { contentFilter } = require('../middleware/contentFilter');
const { auditPost } = require('../middleware/contentAudit');

// 创建动态
router.post('/', auth, contentFilter, auditPost, async (req, res) => {
  try {
    const { content, images, visibility = 'public' } = req.body;

    if (!content && (!images || images.length === 0)) {
      return res.status(400).json({ error: '内容或图片不能为空' });
    }

    const post = new Post({
      userId: req.user._id,
      content,
      images: images || [],
      visibility,
      needsReview: req.body.needsReview || false
    });

    await post.save();
    await post.populate('userId', 'username avatar');

    res.status(201).json({ 
      message: post.needsReview ? '发布成功，等待审核' : '发布成功',
      post 
    });
  } catch (error) {
    res.status(500).json({ error: '发布失败' });
  }
});

// 获取信息流
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // 获取自己 + 关注用户的动态
    const user = await User.findById(req.user._id);
    const followIds = [req.user._id, ...user.following];

    const posts = await Post.find({
      userId: { $in: followIds },
      $or: [
        { visibility: 'public' },
        { userId: req.user._id },
        { visibility: 'friends', userId: { $in: user.friends } }
      ]
    })
      .populate('userId', 'username avatar')
      .populate('comments.userId', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Post.countDocuments({
      userId: { $in: followIds }
    });

    res.json({
      posts,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: '获取动态失败' });
  }
});

// 获取单个动态
router.get('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('userId', 'username avatar')
      .populate('comments.userId', 'username avatar')
      .populate('likes', 'username avatar')
      .populate('favorites', 'username avatar');

    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: '获取动态失败' });
  }
});

// 点赞/取消点赞
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({ message: isLiked ? '已取消点赞' : '已点赞', isLiked: !isLiked });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

// 收藏/取消收藏
router.post('/:postId/favorite', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    const isFavorited = post.favorites.includes(req.user._id);

    if (isFavorited) {
      post.favorites = post.favorites.filter(id => id.toString() !== req.user._id.toString());
    } else {
      post.favorites.push(req.user._id);
    }

    await post.save();

    res.json({ message: isFavorited ? '已取消收藏' : '已收藏', isFavorited: !isFavorited });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

// 添加评论
const { commentFilter } = require('../middleware/contentFilter');
const { auditComment } = require('../middleware/contentAudit');
router.post('/:postId/comment', auth, commentFilter, auditComment, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    post.comments.push({
      userId: req.user._id,
      text
    });

    await post.save();
    await post.populate('comments.userId', 'username avatar');

    res.json({ message: '评论成功', post });
  } catch (error) {
    res.status(500).json({ error: '评论失败' });
  }
});

// 删除评论
router.delete('/:postId/comment/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    const comment = post.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    // 只有评论作者或动态作者可以删除
    if (comment.userId.toString() !== req.user._id.toString() &&
        post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限删除' });
    }

    comment.remove();
    await post.save();

    res.json({ message: '评论已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除评论失败' });
  }
});

// 删除动态
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限删除' });
    }

    await post.deleteOne();

    res.json({ message: '动态已删除' });
  } catch (error) {
    res.status(500).json({ error: '删除动态失败' });
  }
});

// 举报动态
router.post('/:postId/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: '请选择举报原因' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    // 检查是否已举报
    const existing = await Report.findOne({
      reporter: req.user._id,
      targetType: 'post',
      targetId: req.params.postId
    });

    if (existing) {
      return res.status(400).json({ error: '已举报过该动态' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType: 'post',
      targetId: req.params.postId,
      reason,
      description: description || ''
    });

    res.json({ message: '举报成功', report });
  } catch (error) {
    res.status(500).json({ error: '举报失败' });
  }
});

// 搜索动态（按话题标签）
router.get('/hashtag/:tag', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const tag = `#${req.params.tag}`;

    const posts = await Post.find({ hashtags: tag })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({ posts, tag });
  } catch (error) {
    res.status(500).json({ error: '搜索失败' });
  }
});

// 获取收藏的动态
router.get('/favorites/list', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({ favorites: req.user._id })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({ posts });
  } catch (error) {
    res.status(500).json({ error: '获取收藏失败' });
  }
});

module.exports = router;

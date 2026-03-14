/**
 * 草稿箱 API
 */

const express = require('express');
const router = express.Router();
const Draft = require('../models/Draft');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

/**
 * GET /api/drafts
 * 获取我的草稿列表
 */
router.get('/', auth, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    
    const drafts = await Draft.getUserDrafts(req.user._id, type || null);
    
    const skip = (page - 1) * limit;
    const paginatedDrafts = drafts.slice(skip, skip + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedDrafts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: drafts.length,
        totalPages: Math.ceil(drafts.length / limit)
      }
    });
  } catch (error) {
    console.error('获取草稿列表失败:', error);
    res.status(500).json({ error: '获取草稿列表失败' });
  }
});

/**
 * GET /api/drafts/:id
 * 获取草稿详情
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id);
    
    if (!draft) {
      return res.status(404).json({ error: '草稿不存在' });
    }
    
    if (draft.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限查看' });
    }
    
    res.json({
      success: true,
      data: draft
    });
  } catch (error) {
    console.error('获取草稿失败:', error);
    res.status(500).json({ error: '获取草稿失败' });
  }
});

/**
 * POST /api/drafts
 * 创建/更新草稿
 */
router.post('/', auth, async (req, res) => {
  try {
    const { id, type, content, images, videos, poll, visibility, location, tags, mentions, scheduledAt, device } = req.body;
    
    let draft;
    
    if (id) {
      // 更新现有草稿
      draft = await Draft.findById(id);
      
      if (!draft) {
        return res.status(404).json({ error: '草稿不存在' });
      }
      
      if (draft.author.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: '无权限修改' });
      }
      
      await draft.update({
        type: type || draft.type,
        content: content !== undefined ? content : draft.content,
        images: images || draft.images,
        videos: videos || draft.videos,
        poll: poll || draft.poll,
        visibility: visibility || draft.visibility,
        location: location || draft.location,
        tags: tags || draft.tags,
        mentions: mentions || draft.mentions,
        scheduledAt: scheduledAt !== undefined ? scheduledAt : draft.scheduledAt,
        device: device || draft.device
      });
    } else {
      // 创建新草稿
      draft = new Draft({
        author: req.user._id,
        type: type || 'post',
        content: content || '',
        images: images || [],
        videos: videos || [],
        poll: poll || null,
        visibility: visibility || 'public',
        location: location || null,
        tags: tags || [],
        mentions: mentions || [],
        scheduledAt: scheduledAt || null,
        device: device || null
      });
      
      await draft.save();
    }
    
    res.json({
      success: true,
      data: draft,
      message: id ? '草稿已保存' : '草稿已创建'
    });
  } catch (error) {
    console.error('保存草稿失败:', error);
    res.status(500).json({ error: '保存草稿失败' });
  }
});

/**
 * DELETE /api/drafts/:id
 * 删除草稿
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id);
    
    if (!draft) {
      return res.status(404).json({ error: '草稿不存在' });
    }
    
    if (draft.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限删除' });
    }
    
    await Draft.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '草稿已删除'
    });
  } catch (error) {
    console.error('删除草稿失败:', error);
    res.status(500).json({ error: '删除草稿失败' });
  }
});

/**
 * POST /api/drafts/:id/publish
 * 发布草稿
 */
router.post('/:id/publish', auth, async (req, res) => {
  try {
    const draft = await Draft.findById(req.params.id);
    
    if (!draft) {
      return res.status(404).json({ error: '草稿不存在' });
    }
    
    if (draft.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限发布' });
    }
    
    // 准备发布数据
    const publishData = await draft.publish();
    
    // 创建实际内容（这里简化处理，实际应该调用 Post 模型）
    const postData = {
      author: req.user._id,
      content: publishData.content,
      images: publishData.images,
      videos: publishData.videos,
      visibility: publishData.visibility,
      location: publishData.location,
      tags: publishData.tags,
      mentions: publishData.mentions
    };
    
    // 如果有投票，创建投票
    let pollId = null;
    if (publishData.poll) {
      const Poll = require('../models/Poll');
      const poll = new Poll({
        title: publishData.poll.title,
        options: publishData.poll.options.map(opt => ({
          text: opt.text,
          image: opt.image,
          votes: 0
        })),
        settings: publishData.poll.settings,
        creator: req.user._id
      });
      await poll.save();
      pollId = poll._id;
      postData.poll = pollId;
    }
    
    // 创建帖子
    const Post = require('../models/Post');
    const post = new Post(postData);
    await post.save();
    
    // 删除草稿
    await Draft.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      data: post,
      message: '发布成功'
    });
  } catch (error) {
    console.error('发布草稿失败:', error);
    res.status(500).json({ error: '发布失败' });
  }
});

/**
 * GET /api/drafts/scheduled
 * 获取待定时发布的草稿（管理员或系统使用）
 */
router.get('/scheduled/pending', auth, async (req, res) => {
  try {
    // 检查是否是管理员（简化处理）
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: '无权限查看' });
    }
    
    const drafts = await Draft.getScheduledDrafts();
    
    res.json({
      success: true,
      data: drafts
    });
  } catch (error) {
    console.error('获取定时草稿失败:', error);
    res.status(500).json({ error: '获取定时草稿失败' });
  }
});

module.exports = router;

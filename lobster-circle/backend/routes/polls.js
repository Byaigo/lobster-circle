/**
 * 投票 API
 */

const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const auth = require('../middleware/auth');

/**
 * POST /api/polls
 * 创建投票
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, options, settings, expiresAt, postId } = req.body;
    
    if (!title || !options || options.length < 2) {
      return res.status(400).json({ error: '至少需要 2 个选项' });
    }
    
    const poll = new Poll({
      title: title.trim(),
      description: description?.trim() || '',
      options: options.map((opt, i) => ({
        text: opt.text.trim(),
        image: opt.image || '',
        votes: 0,
        order: i
      })),
      settings: {
        multiple: settings?.multiple || false,
        maxChoices: settings?.maxChoices || 1,
        anonymous: settings?.anonymous || false,
        allowChange: settings?.allowChange ?? true
      },
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      creator: req.user._id,
      postId: postId || null
    });
    
    await poll.save();
    
    // 填充创建者信息
    await poll.populate('creator', 'nickname avatar');
    
    res.json({
      success: true,
      data: poll,
      message: '投票创建成功'
    });
  } catch (error) {
    console.error('创建投票失败:', error);
    res.status(500).json({ error: '创建投票失败' });
  }
});

/**
 * GET /api/polls/:id
 * 获取投票详情
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('creator', 'nickname avatar');
    
    if (!poll) {
      return res.status(404).json({ error: '投票不存在' });
    }
    
    // 检查是否过期
    await poll.checkExpired();
    
    // 获取投票结果
    const results = poll.getResults(req.user._id);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('获取投票失败:', error);
    res.status(500).json({ error: '获取投票失败' });
  }
});

/**
 * POST /api/polls/:id/vote
 * 投票
 */
router.post('/:id/vote', auth, async (req, res) => {
  try {
    const { choices } = req.body;
    
    if (!choices) {
      return res.status(400).json({ error: '请选择选项' });
    }
    
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({ error: '投票不存在' });
    }
    
    const results = await poll.vote(req.user._id, choices);
    
    res.json({
      success: true,
      data: results,
      message: '投票成功'
    });
  } catch (error) {
    console.error('投票失败:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/polls/user/:userId
 * 获取用户创建的投票
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'active' } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { creator: req.params.userId };
    if (status !== 'all') {
      query.status = status;
    }
    
    const polls = await Poll.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Poll.countDocuments(query);
    
    const pollsWithResults = polls.map(poll => ({
      ...poll.toObject(),
      totalVotes: poll.totalVotes,
      optionCount: poll.options.length
    }));
    
    res.json({
      success: true,
      data: pollsWithResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取投票列表失败:', error);
    res.status(500).json({ error: '获取投票列表失败' });
  }
});

/**
 * PUT /api/polls/:id
 * 更新投票（仅创建者，且无人投票前）
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({ error: '投票不存在' });
    }
    
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限修改' });
    }
    
    if (poll.totalVotes > 0) {
      return res.status(400).json({ error: '已有投票，无法修改' });
    }
    
    const { title, description, options, settings, expiresAt } = req.body;
    
    if (title) poll.title = title.trim();
    if (description !== undefined) poll.description = description.trim();
    if (options) {
      poll.options = options.map((opt, i) => ({
        text: opt.text.trim(),
        image: opt.image || '',
        votes: 0,
        order: i
      }));
    }
    if (settings) {
      poll.settings = { ...poll.settings, ...settings };
    }
    if (expiresAt !== undefined) {
      poll.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    
    poll.updatedAt = new Date();
    await poll.save();
    
    res.json({
      success: true,
      data: poll,
      message: '投票更新成功'
    });
  } catch (error) {
    console.error('更新投票失败:', error);
    res.status(500).json({ error: '更新投票失败' });
  }
});

/**
 * DELETE /api/polls/:id
 * 删除投票（仅创建者）
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({ error: '投票不存在' });
    }
    
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限删除' });
    }
    
    await Poll.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: '投票已删除'
    });
  } catch (error) {
    console.error('删除投票失败:', error);
    res.status(500).json({ error: '删除投票失败' });
  }
});

/**
 * POST /api/polls/:id/close
 * 关闭投票（仅创建者）
 */
router.post('/:id/close', auth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({ error: '投票不存在' });
    }
    
    if (poll.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: '无权限操作' });
    }
    
    await poll.close();
    
    res.json({
      success: true,
      message: '投票已关闭'
    });
  } catch (error) {
    console.error('关闭投票失败:', error);
    res.status(500).json({ error: '关闭投票失败' });
  }
});

module.exports = router;

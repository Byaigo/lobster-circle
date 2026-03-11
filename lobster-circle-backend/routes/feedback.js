/**
 * 用户反馈 API
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

// 反馈模型
const FeedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['bug', 'suggestion', 'complaint', 'other'],
    required: true
  },
  content: { type: String, required: true, maxlength: 1000 },
  images: [String],
  contact: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'resolved', 'rejected'],
    default: 'pending'
  },
  reply: String,
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  repliedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', FeedbackSchema);

// 提交反馈
router.post('/', auth, async (req, res) => {
  try {
    const { type, content, images, contact } = req.body;
    
    const feedback = await Feedback.create({
      userId: req.user._id,
      type,
      content,
      images: images || [],
      contact
    });

    res.status(201).json({ message: '反馈提交成功', feedback });
  } catch (error) {
    res.status(500).json({ error: '提交反馈失败' });
  }
});

// 获取我的反馈
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const feedbacks = await Feedback.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments({ userId: req.user._id });

    res.json({
      feedbacks,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: '获取反馈失败' });
  }
});

// 管理员 - 获取所有反馈
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;

    const feedbacks = await Feedback.find(query)
      .populate('userId', 'username avatar')
      .populate('repliedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      feedbacks,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: '获取反馈失败' });
  }
});

// 管理员 - 回复反馈
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { reply, status } = req.body;
    
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        reply,
        status: status || 'processing',
        repliedBy: req.user._id,
        repliedAt: new Date()
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ error: '反馈不存在' });
    }

    res.json({ message: '回复成功', feedback });
  } catch (error) {
    res.status(500).json({ error: '回复失败' });
  }
});

module.exports = router;

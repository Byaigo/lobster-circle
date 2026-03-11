/**
 * 用户登录日志模型
 */

const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  device: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown'
  },
  os: {
    type: String
  },
  browser: {
    type: String
  },
  location: {
    country: String,
    province: String,
    city: String
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  failReason: {
    type: String
  },
  loginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
loginLogSchema.index({ userId: 1, loginAt: -1 });
loginLogSchema.index({ ip: 1, loginAt: -1 });

module.exports = mongoose.model('LoginLog', loginLogSchema);

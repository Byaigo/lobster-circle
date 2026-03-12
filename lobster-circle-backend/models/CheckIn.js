/**
 * 签到记录模型
 */

const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  points: {
    type: Number,
    default: 10
  },
  continuousDays: {
    type: Number,
    default: 1
  },
  note: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// 创建复合索引（用户 + 日期）
checkInSchema.index({ userId: 1, createdAt: -1 });

// 每天只能签到一次的验证
checkInSchema.pre('save', async function(next) {
  const CheckIn = this.constructor;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const existingCheckIn = await CheckIn.findOne({
    userId: this.userId,
    createdAt: { $gte: today, $lt: tomorrow }
  });

  if (existingCheckIn) {
    const error = new Error('今天已经签到过了');
    error.status = 400;
    return next(error);
  }

  next();
});

module.exports = mongoose.model('CheckIn', checkInSchema);

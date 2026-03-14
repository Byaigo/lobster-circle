/**
 * 访客记录模型
 * 记录谁访问了你的主页
 */

const mongoose = require('mongoose');

const visitRecordSchema = new mongoose.Schema({
  // 访问者
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 被访问者
  visited: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 访问类型
  type: {
    type: String,
    enum: ['profile', 'moment', 'album'],
    default: 'profile'
  },
  
  // 访问详情
  details: {
    momentId: mongoose.Schema.Types.ObjectId, // 如果是访问动态
    albumId: mongoose.Schema.Types.ObjectId, // 如果是访问相册
    duration: Number // 停留时长（秒）
  },
  
  // 是否匿名
  anonymous: {
    type: Boolean,
    default: false
  },
  
  // 是否已读
  isRead: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 复合索引：被访问者 + 时间
visitRecordSchema.index({ visited: 1, createdAt: -1 });
visitRecordSchema.index({ visitor: 1, visited: 1, createdAt: -1 });
visitRecordSchema.index({ visited: 1, type: 1, createdAt: -1 });

// 防止重复记录（同一用户同一天只记录一次）
visitRecordSchema.statics.recordVisit = async function(visitorId, visitedId, type = 'profile', details = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 检查今天是否已有记录
  const existing = await this.findOne({
    visitor: visitorId,
    visited: visitedId,
    type: type,
    createdAt: { $gte: today }
  });
  
  if (existing) {
    // 更新停留时长
    if (details.duration) {
      existing.details.duration = (existing.details.duration || 0) + details.duration;
      await existing.save();
    }
    return existing;
  }
  
  // 创建新记录
  const record = new this({
    visitor: visitorId,
    visited: visitedId,
    type,
    details,
    createdAt: new Date()
  });
  
  await record.save();
  return record;
};

// 获取用户的访客列表
visitRecordSchema.statics.getVisitors = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const records = await this.find({ visited: userId })
    .populate('visitor', 'nickname avatar gender age')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await this.countDocuments({ visited: userId });
  
  return {
    records,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// 获取用户访问过的人
visitRecordSchema.statics.getVisitedUsers = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const records = await this.find({ visitor: userId })
    .populate('visited', 'nickname avatar gender age')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await this.countDocuments({ visitor: userId });
  
  return {
    records,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// 批量标记已读
visitRecordSchema.statics.markAsRead = async function(userId, visitorIds = []) {
  const query = { visited: userId, isRead: false };
  if (visitorIds && visitorIds.length > 0) {
    query.visitor = { $in: visitorIds };
  }
  
  const result = await this.updateMany(query, { isRead: true });
  return result.modifiedCount;
};

// 获取未读访客数量
visitRecordSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ visited: userId, isRead: false });
};

module.exports = mongoose.model('VisitRecord', visitRecordSchema);

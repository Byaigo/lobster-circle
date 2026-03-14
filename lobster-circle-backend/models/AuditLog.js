/**
 * 内容审核日志模型
 * 
 * 记录所有内容审核操作，用于追溯和分析
 */

const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  // 内容
  content: {
    type: String,
    required: true,
  },
  
  // 内容类型
  contentType: {
    type: String,
    enum: ['text', 'image', 'comment', 'nickname', 'bio'],
    required: true,
  },
  
  // 审核结果
  result: {
    type: String,
    enum: ['pass', 'review', 'block'],
    required: true,
    index: true,
  },
  
  // 置信度
  confidence: {
    type: Number,
    default: 0,
  },
  
  // 违规标签
  labels: [{
    type: String,
  }],
  
  // 命中的关键词
  keywords: [{
    type: String,
  }],
  
  // 用户 ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  
  // 关联内容 ID（动态 ID/评论 ID 等）
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  
  // 额外信息
  extra: {
    type: Object,
    default: {},
  },
  
  // 时间戳
  timestamp: {
    type: Number,
    required: true,
    index: true,
  },
  
  // 是否已处理（针对 review 状态）
  isProcessed: {
    type: Boolean,
    default: false,
    index: true,
  },
  
  // 处理备注
  processedNote: {
    type: String,
    default: '',
  },
  
  // 处理人
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // 处理时间
  processedAt: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
  collection: 'audit_logs',
});

// 索引优化
AuditLogSchema.index({ result: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ contentType: 1, result: 1 });
AuditLogSchema.index({ isProcessed: 1, timestamp: -1 });

// 静态方法：获取审核统计
AuditLogSchema.statics.getAuditStats = async function(timeRange = '24h') {
  const AuditLog = this;
  const now = Date.now();
  let startTime;
  
  switch (timeRange) {
    case '1h': startTime = now - 3600000; break;
    case '24h': startTime = now - 86400000; break;
    case '7d': startTime = now - 604800000; break;
    case '30d': startTime = now - 2592000000; break;
    default: startTime = now - 86400000;
  }
  
  const [
    total,
    byResult,
    byContentType,
    blockedCount,
    reviewCount,
  ] = await Promise.all([
    AuditLog.countDocuments({ timestamp: { $gte: startTime } }),
    AuditLog.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      { $group: { _id: '$result', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLog.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      { $group: { _id: '$contentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    AuditLog.countDocuments({ 
      timestamp: { $gte: startTime },
      result: 'block',
    }),
    AuditLog.countDocuments({ 
      timestamp: { $gte: startTime },
      result: 'review',
      isProcessed: false,
    }),
  ]);
  
  return {
    total,
    byResult,
    byContentType,
    blockedCount,
    reviewCount,
    timeRange,
  };
};

// 静态方法：获取待审核内容
AuditLogSchema.statics.getPendingReviews = async function(limit = 20) {
  return await this.find({
    result: 'review',
    isProcessed: false,
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'username avatar');
};

// 静态方法：标记为已处理
AuditLogSchema.statics.processAudit = async function(id, decision, note, processedBy) {
  return await this.findByIdAndUpdate(id, {
    isProcessed: true,
    processedNote: note,
    processedBy,
    processedAt: Date.now(),
    extra: {
      decision, // approve/reject
    },
  });
};

// 静态方法：清理旧日志（保留最近 90 天）
AuditLogSchema.statics.cleanupOldLogs = async function(daysToKeep = 90) {
  const cutoff = Date.now() - (daysToKeep * 86400000);
  const result = await this.deleteMany({
    timestamp: { $lt: cutoff },
    isProcessed: true,
  });
  return result.deletedCount;
};

module.exports = mongoose.model('AuditLog', AuditLogSchema);

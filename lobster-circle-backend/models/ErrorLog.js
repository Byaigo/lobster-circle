/**
 * 错误日志模型
 * 
 * 用于记录和追踪应用中的错误
 */

const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
  // 错误类型
  type: {
    type: String,
    enum: ['NETWORK_ERROR', 'API_ERROR', 'VALIDATION_ERROR', 'PERMISSION_ERROR', 'UNKNOWN_ERROR', 'RENDER_ERROR'],
    required: true,
    index: true,
  },
  
  // 错误消息
  message: {
    type: String,
    required: true,
  },
  
  // 堆栈跟踪
  stack: {
    type: String,
    default: '',
  },
  
  // 严重程度
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  },
  
  // 错误指纹（用于去重）
  fingerprint: {
    type: String,
    required: true,
    index: true,
  },
  
  // 时间戳
  timestamp: {
    type: Number,
    required: true,
    index: true,
  },
  
  // 组件名称
  component: {
    type: String,
    default: 'unknown',
    index: true,
  },
  
  // 操作名称
  action: {
    type: String,
    default: 'unknown',
  },
  
  // 额外信息
  extra: {
    type: Object,
    default: {},
  },
  
  // 设备信息
  device: {
    platform: String,
    platformVersion: String,
    networkType: String,
    isConnected: Boolean,
    locale: String,
    brand: String,
    model: String,
  },
  
  // 用户信息
  user: {
    userId: {
      type: String,
      default: 'anonymous',
      index: true,
    },
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
  },
  
  // 应用版本
  appVersion: {
    type: String,
    default: 'unknown',
  },
  
  // 构建号
  buildNumber: {
    type: String,
    default: 'unknown',
  },
  
  // 是否已处理
  isResolved: {
    type: Boolean,
    default: false,
    index: true,
  },
  
  // 处理备注
  resolvedNote: {
    type: String,
    default: '',
  },
  
  // 处理时间
  resolvedAt: {
    type: Number,
    default: null,
  },
  
  // 处理人
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  
  // 发生次数（相同指纹的错误）
  occurrenceCount: {
    type: Number,
    default: 1,
  },
  
  // 最后发生时间
  lastOccurredAt: {
    type: Number,
    default: null,
  },
}, {
  timestamps: true,
  collection: 'error_logs',
});

// 索引优化
ErrorLogSchema.index({ fingerprint: 1, timestamp: -1 });
ErrorLogSchema.index({ type: 1, severity: 1, timestamp: -1 });
ErrorLogSchema.index({ 'user.userId': 1, timestamp: -1 });
ErrorLogSchema.index({ isResolved: 1, timestamp: -1 });

// 静态方法：记录错误
ErrorLogSchema.statics.recordError = async function(errorData) {
  const ErrorLog = this;
  
  // 查找是否有相同指纹的错误（1 小时内）
  const oneHourAgo = Date.now() - 3600000;
  const existing = await ErrorLog.findOne({
    fingerprint: errorData.fingerprint,
    timestamp: { $gte: oneHourAgo },
  });
  
  if (existing) {
    // 更新现有记录
    existing.occurrenceCount += 1;
    existing.lastOccurredAt = Date.now();
    return await existing.save();
  }
  
  // 创建新记录
  return await ErrorLog.create(errorData);
};

// 静态方法：获取错误统计
ErrorLogSchema.statics.getErrorStats = async function(timeRange = '24h') {
  const ErrorLog = this;
  const now = Date.now();
  let startTime;
  
  switch (timeRange) {
    case '1h':
      startTime = now - 3600000;
      break;
    case '24h':
      startTime = now - 86400000;
      break;
    case '7d':
      startTime = now - 604800000;
      break;
    case '30d':
      startTime = now - 2592000000;
      break;
    default:
      startTime = now - 86400000;
  }
  
  const [
    total,
    byType,
    bySeverity,
    topErrors,
    unresolvedCount,
  ] = await Promise.all([
    ErrorLog.countDocuments({ timestamp: { $gte: startTime } }),
    ErrorLog.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      { $group: { _id: '$type', count: { $sum: '$occurrenceCount' } } },
      { $sort: { count: -1 } },
    ]),
    ErrorLog.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      { $group: { _id: '$severity', count: { $sum: '$occurrenceCount' } } },
      { $sort: { count: -1 } },
    ]),
    ErrorLog.aggregate([
      { $match: { timestamp: { $gte: startTime } } },
      { $group: { 
          _id: { 
            fingerprint: '$fingerprint',
            message: '$message',
            type: '$type',
          },
          count: { $sum: '$occurrenceCount' },
          lastOccurredAt: { $max: '$lastOccurredAt' },
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    ErrorLog.countDocuments({ 
      timestamp: { $gte: startTime },
      isResolved: false,
    }),
  ]);
  
  return {
    total,
    byType,
    bySeverity,
    topErrors,
    unresolvedCount,
    timeRange,
  };
};

// 静态方法：标记错误为已解决
ErrorLogSchema.statics.resolveError = async function(fingerprint, note, resolvedBy) {
  return await this.updateMany(
    { fingerprint },
    {
      $set: {
        isResolved: true,
        resolvedNote: note,
        resolvedAt: Date.now(),
        resolvedBy,
      },
    }
  );
};

// 静态方法：清理旧错误（保留最近 30 天）
ErrorLogSchema.statics.cleanupOldErrors = async function(daysToKeep = 30) {
  const cutoff = Date.now() - (daysToKeep * 86400000);
  const result = await this.deleteMany({
    timestamp: { $lt: cutoff },
    isResolved: true,
  });
  return result.deletedCount;
};

module.exports = mongoose.model('ErrorLog', ErrorLogSchema);

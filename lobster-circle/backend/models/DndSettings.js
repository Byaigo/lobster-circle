/**
 * 免打扰设置模型
 * DND (Do Not Disturb) 配置
 */

const mongoose = require('mongoose');

const dndSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // 全局免打扰
  globalDnd: {
    enabled: {
      type: Boolean,
      default: false
    },
    // 免打扰模式
    mode: {
      type: String,
      enum: ['all', 'mentions_only', 'none'],
      default: 'all'
    }
  },
  
  // 定时免打扰
  scheduledDnd: {
    enabled: {
      type: Boolean,
      default: false
    },
    // 开始时间（小时：分钟）
    startTime: {
      type: String,
      default: '23:00'
    },
    // 结束时间（小时：分钟）
    endTime: {
      type: String,
      default: '08:00'
    },
    // 生效日期
    activeDays: {
      type: [String], // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
      default: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    }
  },
  
  // 用户级别免打扰
  userDnd: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // 免打扰类型
    type: {
      type: String,
      enum: ['mute', 'block'],
      default: 'mute'
    },
    // 静音类型
    muteType: {
      type: String,
      enum: ['all', 'messages', 'notifications'],
      default: 'all'
    },
    // 过期时间（null 表示永久）
    expiresAt: Date,
    // 添加时间
    addedAt: {
      type: Date,
      default: Date.now
    },
    // 原因
    reason: String
  }],
  
  // 群组免打扰
  groupDnd: [{
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    // 免打扰类型
    type: {
      type: String,
      enum: ['mute', 'mentions_only'],
      default: 'mute'
    },
    // 过期时间
    expiresAt: Date,
    // 添加时间
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 关键词过滤
  keywordFilter: {
    enabled: {
      type: Boolean,
      default: false
    },
    // 屏蔽关键词
    keywords: [String],
    // 动作
    action: {
      type: String,
      enum: ['hide', 'fold', 'notify'],
      default: 'fold'
    }
  },
  
  // 推送设置
  pushSettings: {
    // 允许推送
    enabled: {
      type: Boolean,
      default: true
    },
    // 推送类型
    types: {
      messages: {
        type: Boolean,
        default: true
      },
      likes: {
        type: Boolean,
        default: true
      },
      comments: {
        type: Boolean,
        default: true
      },
      system: {
        type: Boolean,
        default: true
      }
    },
    // 推送摘要
    showPreview: {
      type: Boolean,
      default: true
    }
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
dndSettingsSchema.index({ user: 1 });
dndSettingsSchema.index({ 'userDnd.user': 1 });
dndSettingsSchema.index({ 'groupDnd.group': 1 });

// 检查是否在定时免打扰时段
dndSettingsSchema.methods.isInScheduledDnd = function() {
  if (!this.scheduledDnd.enabled) {
    return false;
  }
  
  const now = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const currentDay = dayNames[now.getDay()];
  
  if (!this.scheduledDnd.activeDays.includes(currentDay)) {
    return false;
  }
  
  const [startHour, startMin] = this.scheduledDnd.startTime.split(':').map(Number);
  const [endHour, endMin] = this.scheduledDnd.endTime.split(':').map(Number);
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  // 处理跨天情况
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    return currentTime >= startTime || currentTime <= endTime;
  }
};

// 检查是否处于免打扰状态
dndSettingsSchema.methods.isDndActive = function() {
  return this.globalDnd.enabled || this.isInScheduledDnd();
};

// 检查用户是否被免打扰
dndSettingsSchema.methods.isUserMuted = function(userId) {
  const dnd = this.userDnd.find(
    item => item.user.toString() === userId.toString()
  );
  
  if (!dnd) {
    return false;
  }
  
  if (dnd.expiresAt && new Date() > dnd.expiresAt) {
    return false;
  }
  
  return dnd.type === 'mute' || dnd.type === 'block';
};

// 添加用户免打扰
dndSettingsSchema.methods.addUserDnd = async function(userId, type = 'mute', muteType = 'all', duration = null, reason = '') {
  const existing = this.userDnd.find(
    item => item.user.toString() === userId.toString()
  );
  
  if (existing) {
    existing.type = type;
    existing.muteType = muteType;
    existing.reason = reason;
    existing.expiresAt = duration ? new Date(Date.now() + duration) : null;
  } else {
    this.userDnd.push({
      user: userId,
      type,
      muteType,
      expiresAt: duration ? new Date(Date.now() + duration) : null,
      reason
    });
  }
  
  this.updatedAt = new Date();
  await this.save();
};

// 移除用户免打扰
dndSettingsSchema.methods.removeUserDnd = async function(userId) {
  this.userDnd = this.userDnd.filter(
    item => item.user.toString() !== userId.toString()
  );
  this.updatedAt = new Date();
  await this.save();
};

// 静态方法：获取用户免打扰设置
dndSettingsSchema.statics.getUserDnd = async function(userId) {
  let settings = await this.findOne({ user: userId });
  
  if (!settings) {
    settings = new this({ user: userId });
    await settings.save();
  }
  
  return settings;
};

module.exports = mongoose.model('DndSettings', dndSettingsSchema);

/**
 * 隐私设置模型
 * 用户隐私配置
 */

const mongoose = require('mongoose');

const privacySettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // 可见性设置
  visibility: {
    // 谁可以看我的动态
    posts: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    
    // 谁可以看我的相册
    albums: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'friends'
    },
    
    // 谁可以看我的在线状态
    onlineStatus: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'friends'
    },
    
    // 谁可以看我的访客记录
    visitors: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'friends'
    }
  },
  
  // 互动设置
  interaction: {
    // 谁可以评论我
    comments: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    
    // 谁可以@我
    mentions: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'everyone'
    },
    
    // 谁可以给我发消息
    messages: {
      type: String,
      enum: ['everyone', 'friends', 'nobody'],
      default: 'friends'
    },
    
    // 谁可以加我好友
    friendRequests: {
      type: String,
      enum: ['everyone', 'friends_of_friends', 'nobody'],
      default: 'everyone'
    }
  },
  
  // 发现设置
  discovery: {
    // 在附近的人中显示
    showInNearby: {
      type: Boolean,
      default: true
    },
    
    // 在推荐中显示
    showInRecommendations: {
      type: Boolean,
      default: true
    },
    
    // 允许通过手机号搜索
    allowSearchByPhone: {
      type: Boolean,
      default: true
    },
    
    // 允许通过微信号搜索
    allowSearchByWechat: {
      type: Boolean,
      default: false
    }
  },
  
  // 通知设置
  notifications: {
    // 点赞通知
    likes: {
      type: Boolean,
      default: true
    },
    
    // 评论通知
    comments: {
      type: Boolean,
      default: true
    },
    
    // 关注通知
    follows: {
      type: Boolean,
      default: true
    },
    
    // 系统通知
    system: {
      type: Boolean,
      default: true
    },
    
    // 营销通知
    marketing: {
      type: Boolean,
      default: false
    }
  },
  
  // 黑名单
  blacklist: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  
  // 白名单（特别关注）
  whitelist: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
privacySettingsSchema.index({ user: 1 });
privacySettingsSchema.index({ 'blacklist.user': 1 });
privacySettingsSchema.index({ 'whitelist.user': 1 });

// 检查用户是否在黑名单中
privacySettingsSchema.methods.isBlocked = function(userId) {
  return this.blacklist.some(item => item.user.toString() === userId.toString());
};

// 添加黑名单
privacySettingsSchema.methods.addToBlacklist = async function(userId, reason = '') {
  if (!this.isBlocked(userId)) {
    this.blacklist.push({ user: userId, reason, addedAt: new Date() });
    this.updatedAt = new Date();
    await this.save();
  }
};

// 移除黑名单
privacySettingsSchema.methods.removeFromBlacklist = async function(userId) {
  this.blacklist = this.blacklist.filter(item => item.user.toString() !== userId.toString());
  this.updatedAt = new Date();
  await this.save();
};

// 检查用户是否在白名单中
privacySettingsSchema.methods.isWhitelisted = function(userId) {
  return this.whitelist.some(item => item.user.toString() === userId.toString());
};

// 添加白名单
privacySettingsSchema.methods.addToWhitelist = async function(userId) {
  if (!this.isWhitelisted(userId)) {
    this.whitelist.push({ user: userId, addedAt: new Date() });
    this.updatedAt = new Date();
    await this.save();
  }
};

// 移除白名单
privacySettingsSchema.methods.removeFromWhitelist = async function(userId) {
  this.whitelist = this.whitelist.filter(item => item.user.toString() !== userId.toString());
  this.updatedAt = new Date();
  await this.save();
};

// 静态方法：获取用户隐私设置
privacySettingsSchema.statics.getUserSettings = async function(userId) {
  let settings = await this.findOne({ user: userId });
  
  if (!settings) {
    settings = new this({ user: userId });
    await settings.save();
  }
  
  return settings;
};

// 静态方法：检查权限
privacySettingsSchema.statics.canAccess = async function(ownerId, viewerId, settingPath) {
  const settings = await this.getUserSettings(ownerId);
  
  // 白名单总是可以访问
  if (settings.isWhitelisted(viewerId)) {
    return true;
  }
  
  // 黑名单总是不能访问
  if (settings.isBlocked(viewerId)) {
    return false;
  }
  
  // 获取设置值
  const keys = settingPath.split('.');
  let value = settings;
  for (const key of keys) {
    value = value?.[key];
  }
  
  // 根据设置值判断
  if (value === 'public' || value === 'everyone') {
    return true;
  }
  
  if (value === 'private' || value === 'nobody') {
    return false;
  }
  
  if (value === 'friends') {
    // 需要检查是否是好友（这里简化处理）
    return true; // 实际应该查询好友关系
  }
  
  return false;
};

module.exports = mongoose.model('PrivacySettings', privacySettingsSchema);

/**
 * 头像框模型
 * 用户成就装饰系统
 */

const mongoose = require('mongoose');

const avatarFrameSchema = new mongoose.Schema({
  // 头像框名称
  name: {
    type: String,
    required: true
  },
  
  // 头像框标识
  key: {
    type: String,
    required: true,
    unique: true
  },
  
  // 描述
  description: String,
  
  // 头像框图片 URL
  image: {
    type: String,
    required: true
  },
  
  // 边框类型
  type: {
    type: String,
    enum: ['frame', 'badge', 'effect', 'corner'],
    default: 'frame'
  },
  
  // 稀有度
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
  // 获取方式
  acquisition: {
    type: String,
    enum: ['default', 'achievement', 'event', 'purchase', 'vip', 'level'],
    default: 'default'
  },
  
  // 获取条件
  condition: {
    type: String, // 例如："连续签到 30 天"、"等级达到 10 级"
    default: ''
  },
  
  // 是否需要付费
  isPremium: {
    type: Boolean,
    default: false
  },
  
  // 价格（积分）
  price: {
    type: Number,
    default: 0
  },
  
  // 有效期（天），0 表示永久
  duration: {
    type: Number,
    default: 0
  },
  
  // 排序
  order: {
    type: Number,
    default: 0
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

avatarFrameSchema.index({ key: 1 });
avatarFrameSchema.index({ rarity: 1, order: 1 });

// 用户拥有的头像框
const userFrameSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  frame: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AvatarFrame',
    required: true
  },
  
  // 获得时间
  obtainedAt: {
    type: Date,
    default: Date.now
  },
  
  // 过期时间（null 表示永久）
  expiresAt: {
    type: Date,
    default: null
  },
  
  // 是否正在使用
  isEquipped: {
    type: Boolean,
    default: false
  },
  
  // 获得方式
  obtainedFrom: {
    type: String,
    default: ''
  }
});

userFrameSchema.index({ user: 1, isEquipped: 1 });
userFrameSchema.index({ user: 1, expiresAt: 1 });

// 静态方法：检查并更新过期头像框
userFrameSchema.statics.checkExpired = async function(userId) {
  const now = new Date();
  const result = await this.updateMany(
    {
      user: userId,
      expiresAt: { $lte: now },
      isEquipped: true
    },
    { isEquipped: false }
  );
  return result.modifiedCount;
};

// 静态方法：获取用户所有头像框
userFrameSchema.statics.getUserFrames = async function(userId) {
  await this.checkExpired(userId);
  
  return await this.find({ user: userId })
    .populate('frame')
    .sort({ isEquipped: -1, obtainedAt: -1 });
};

// 静态方法：获取用户当前装备的头像框
userFrameSchema.statics.getCurrentUserFrame = async function(userId) {
  const userFrame = await this.findOne({
    user: userId,
    isEquipped: true
  }).populate('frame');
  
  // 检查是否过期
  if (userFrame && userFrame.expiresAt && new Date() > userFrame.expiresAt) {
    userFrame.isEquipped = false;
    await userFrame.save();
    return null;
  }
  
  return userFrame;
};

// 实例方法：装备头像框
userFrameSchema.methods.equip = async function() {
  // 先卸下当前装备的
  await this.constructor.updateMany(
    { user: this.user, isEquipped: true },
    { isEquipped: false }
  );
  
  // 检查是否过期
  if (this.expiresAt && new Date() > this.expiresAt) {
    throw new Error('头像框已过期');
  }
  
  this.isEquipped = true;
  await this.save();
};

module.exports = {
  AvatarFrame: mongoose.model('AvatarFrame', avatarFrameSchema),
  UserFrame: mongoose.model('UserFrame', userFrameSchema)
};

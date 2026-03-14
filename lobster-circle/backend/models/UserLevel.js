/**
 * 用户等级模型
 * 经验值/等级系统
 */

const mongoose = require('mongoose');

// 等级配置
const levelConfig = {
  maxLevel: 100,
  baseExp: 100,
  expMultiplier: 1.5,
  dailyExpLimit: 1000 // 每日经验上限
};

// 计算升级所需经验
function getExpForLevel(level) {
  return Math.floor(levelConfig.baseExp * Math.pow(levelConfig.expMultiplier, level - 1));
}

// 计算总经验
function getTotalExpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getExpForLevel(i);
  }
  return total;
}

const userLevelSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // 等级
  level: {
    type: Number,
    default: 1,
    min: 1,
    max: levelConfig.maxLevel
  },
  
  // 当前经验
  exp: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 总经验（历史累计）
  totalExp: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // 今日获得经验
  todayExp: {
    type: Number,
    default: 0
  },
  
  // 今日经验重置时间
  expResetAt: {
    type: Date,
    default: Date.now
  },
  
  // 等级进度
  levelProgress: {
    type: Number, // 当前等级进度百分比
    default: 0
  },
  
  // 等级头衔
  title: {
    type: String,
    default: '新手龙虾'
  },
  
  // 等级历史
  levelHistory: [{
    fromLevel: Number,
    toLevel: Number,
    achievedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// 索引
userLevelSchema.index({ user: 1 });
userLevelSchema.index({ level: -1, totalExp: -1 });
userLevelSchema.index({ expResetAt: 1 });

// 静态方法：获取等级配置
userLevelSchema.statics.getLevelConfig = function() {
  return levelConfig;
};

// 静态方法：计算升级所需经验
userLevelSchema.statics.getExpForLevel = getExpForLevel;

// 静态方法：获取等级排行榜
userLevelSchema.statics.getLeaderboard = async function(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const users = await this.find()
    .populate('user', 'nickname avatar')
    .sort({ level: -1, totalExp: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await this.countDocuments();
  
  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// 实例方法：添加经验
userLevelSchema.methods.addExp = async function(amount) {
  // 检查每日重置
  const now = new Date();
  const lastReset = new Date(this.expResetAt);
  const daysDiff = Math.floor((now - lastReset) / (24 * 60 * 60 * 1000));
  
  if (daysDiff >= 1) {
    this.todayExp = 0;
    this.expResetAt = now;
  }
  
  // 检查每日上限
  const remainingExp = levelConfig.dailyExpLimit - this.todayExp;
  const actualExp = Math.min(amount, remainingExp);
  
  if (actualExp <= 0) {
    return { leveledUp: false, expGained: 0, message: '今日经验已达上限' };
  }
  
  this.exp += actualExp;
  this.totalExp += actualExp;
  this.todayExp += actualExp;
  
  // 检查升级
  let leveledUp = false;
  const requiredExp = getExpForLevel(this.level);
  
  while (this.exp >= requiredExp && this.level < levelConfig.maxLevel) {
    this.exp -= requiredExp;
    this.level += 1;
    this.levelProgress = 0;
    leveledUp = true;
    
    // 记录等级历史
    this.levelHistory.push({
      fromLevel: this.level - 1,
      toLevel: this.level,
      achievedAt: new Date()
    });
    
    // 更新头衔
    this.title = this.getLevelTitle(this.level);
  }
  
  // 更新进度
  this.levelProgress = (this.exp / requiredExp) * 100;
  
  await this.save();
  
  return {
    leveledUp,
    expGained: actualExp,
    currentLevel: this.level,
    currentExp: this.exp,
    progress: this.levelProgress
  };
};

// 实例方法：获取等级头衔
userLevelSchema.methods.getLevelTitle = function(level) {
  const titles = {
    1: '新手龙虾',
    10: '活跃龙虾',
    20: '人气龙虾',
    30: '明星龙虾',
    40: '网红龙虾',
    50: '龙虾达人',
    60: '龙虾专家',
    70: '龙虾大师',
    80: '龙虾传奇',
    90: '龙虾之神',
    100: '龙虾至尊'
  };
  
  for (const [lvl, title] of Object.entries(titles).reverse()) {
    if (level >= parseInt(lvl)) return title;
  }
  
  return '新手龙虾';
};

// 实例方法：获取下一级所需经验
userLevelSchema.methods.getExpToNextLevel = function() {
  const requiredExp = getExpForLevel(this.level);
  return requiredExp - this.exp;
};

module.exports = mongoose.model('UserLevel', userLevelSchema);

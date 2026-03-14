/**
 * 成就徽章模型
 */

const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  // 成就名称
  name: {
    type: String,
    required: true
  },
  
  // 成就标识
  key: {
    type: String,
    required: true,
    unique: true
  },
  
  // 描述
  description: String,
  
  // 图标
  icon: {
    type: String,
    required: true
  },
  
  // 徽章图片
  badge: {
    type: String,
    required: true
  },
  
  // 分类
  category: {
    type: String,
    enum: ['social', 'content', 'activity', 'special', 'event'],
    default: 'social'
  },
  
  // 稀有度
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
  // 成就类型
  type: {
    type: String,
    enum: ['once', 'progressive', 'recurring'],
    default: 'once'
  },
  
  // 达成条件
  condition: {
    type: {
      type: String, // 'post_count', 'like_count', 'follower_count', 'login_days', etc.
      required: true
    },
    operator: {
      type: String, // 'gte', 'eq', 'in'
      default: 'gte'
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // 目标值
      required: true
    }
  },
  
  // 奖励
  reward: {
    exp: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    },
    frame: String, // 头像框 key
    title: String // 专属头衔
  },
  
  // 隐藏成就
  hidden: {
    type: Boolean,
    default: false
  },
  
  // 隐藏时的描述（达成后显示真实描述）
  hiddenDescription: String,
  
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

achievementSchema.index({ key: 1 });
achievementSchema.index({ category: 1, rarity: 1, order: 1 });

// 用户成就
const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  
  // 达成时间
  achievedAt: {
    type: Date,
    default: Date.now
  },
  
  // 进度（用于渐进式成就）
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  
  // 已领取奖励
  rewardClaimed: {
    type: Boolean,
    default: false
  },
  
  // 领取奖励时间
  rewardClaimedAt: Date
});

userAchievementSchema.index({ user: 1, achievedAt: -1 });
userAchievementSchema.index({ user: 1, 'progress.completed': 1 });

// 静态方法：获取用户成就
userAchievementSchema.statics.getUserAchievements = async function(userId) {
  return await this.find({ user: userId })
    .populate('achievement')
    .sort({ achievedAt: -1 });
};

// 静态方法：获取用户成就进度
userAchievementSchema.statics.getUserProgress = async function(userId, achievementKey) {
  const achievement = await mongoose.model('Achievement').findOne({ key: achievementKey });
  if (!achievement) return null;
  
  let userAchievement = await this.findOne({
    user: userId,
    achievement: achievement._id
  });
  
  if (!userAchievement) {
    // 创建新进度记录
    userAchievement = new this({
      user: userId,
      achievement: achievement._id,
      progress: {
        current: 0,
        target: achievement.condition.value,
        completed: false
      }
    });
    await userAchievement.save();
  }
  
  return userAchievement;
};

// 实例方法：更新进度
userAchievementSchema.methods.updateProgress = async function(current) {
  this.progress.current = current;
  this.progress.completed = current >= this.progress.target;
  
  if (this.progress.completed && !this.achievedAt) {
    this.achievedAt = new Date();
  }
  
  await this.save();
  return this.progress.completed;
};

module.exports = {
  Achievement: mongoose.model('Achievement', achievementSchema),
  UserAchievement: mongoose.model('UserAchievement', userAchievementSchema)
};

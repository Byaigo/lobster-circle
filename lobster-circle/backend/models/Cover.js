/**
 * 封面图模型
 * 用户个人主页背景
 */

const mongoose = require('mongoose');

const coverSchema = new mongoose.Schema({
  // 封面图名称
  name: {
    type: String,
    required: true
  },
  
  // 封面图标识
  key: {
    type: String,
    required: true,
    unique: true
  },
  
  // 描述
  description: String,
  
  // 封面图 URL
  image: {
    type: String,
    required: true
  },
  
  // 缩略图 URL
  thumbnail: String,
  
  // 分类
  category: {
    type: String,
    enum: ['default', 'nature', 'city', 'abstract', 'art', 'anime', 'custom'],
    default: 'default'
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
  
  // 使用次数
  usageCount: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

coverSchema.index({ key: 1 });
coverSchema.index({ category: 1, order: 1 });

// 用户封面图
const userCoverSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // 当前使用的封面
  currentCover: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cover'
  },
  
  // 自定义上传的封面
  customCover: {
    url: String,
    thumbnail: String,
    uploadedAt: Date
  },
  
  // 历史封面
  history: [{
    cover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cover'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    duration: Number // 使用时长（天）
  }],
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userCoverSchema.index({ user: 1 });

// 静态方法：获取用户封面
userCoverSchema.statics.getUserCover = async function(userId) {
  return await this.findOne({ user: userId })
    .populate('currentCover')
    .exec();
};

// 实例方法：设置封面
userCoverSchema.methods.setCover = async function(coverId) {
  const Cover = mongoose.model('Cover');
  const cover = await Cover.findById(coverId);
  
  if (!cover) {
    throw new Error('封面不存在');
  }
  
  // 记录历史
  if (this.currentCover) {
    const oldCover = await Cover.findById(this.currentCover);
    if (oldCover) {
      this.history.push({
        cover: this.currentCover,
        usedAt: new Date(),
        duration: 0 // 实际使用时长需要计算
      });
    }
  }
  
  this.currentCover = coverId;
  this.updatedAt = new Date();
  
  // 增加使用次数
  cover.usageCount += 1;
  await cover.save();
  
  await this.save();
};

// 实例方法：设置自定义封面
userCoverSchema.methods.setCustomCover = async function(url, thumbnail = null) {
  this.customCover = {
    url,
    thumbnail: thumbnail || url,
    uploadedAt: new Date()
  };
  this.currentCover = null; // 自定义封面优先
  this.updatedAt = new Date();
  await this.save();
};

module.exports = {
  Cover: mongoose.model('Cover', coverSchema),
  UserCover: mongoose.model('UserCover', userCoverSchema)
};

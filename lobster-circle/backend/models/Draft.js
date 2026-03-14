/**
 * 草稿箱模型
 * 自动保存用户未发布的动态/内容
 */

const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  // 作者
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 草稿类型
  type: {
    type: String,
    enum: ['post', 'moment', 'article', 'comment'],
    default: 'post'
  },
  
  // 内容
  content: {
    type: String,
    default: '',
    maxlength: 10000
  },
  
  // 媒体
  images: [{
    url: String,
    thumbnail: String,
    order: Number,
    uploadedAt: Date
  }],
  
  videos: [{
    url: String,
    thumbnail: String,
    duration: Number,
    uploadedAt: Date
  }],
  
  // 投票（如果关联投票）
  poll: {
    title: String,
    options: [{
      text: String,
      image: String
    }],
    settings: {
      multiple: Boolean,
      maxChoices: Number,
      anonymous: Boolean
    }
  },
  
  // 可见性
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'public'
  },
  
  // 位置
  location: {
    name: String,
    address: String,
    coordinates: [Number] // [lng, lat]
  },
  
  // 标签
  tags: [String],
  
  // 提及
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 定时发布
  scheduledAt: {
    type: Date
  },
  
  // 自动保存时间戳
  lastSavedAt: {
    type: Date,
    default: Date.now
  },
  
  // 设备信息
  device: {
    type: String, // mobile/desktop
    platform: String // ios/android/web
  }
}, {
  timestamps: true
});

// 索引
draftSchema.index({ author: 1, updatedAt: -1 });
draftSchema.index({ author: 1, type: 1 });
draftSchema.index({ scheduledAt: 1 }, { sparse: true });

// 静态方法：获取用户的草稿
draftSchema.statics.getUserDrafts = async function(userId, type = null) {
  const query = { author: userId };
  if (type) {
    query.type = type;
  }
  
  return await this.find(query)
    .sort({ updatedAt: -1 })
    .populate('mentions', 'nickname avatar');
};

// 静态方法：获取定时发布的草稿
draftSchema.statics.getScheduledDrafts = async function() {
  const now = new Date();
  
  return await this.find({
    scheduledAt: {
      $lte: now
    },
    status: { $ne: 'published' }
  }).populate('author');
};

// 实例方法：更新草稿
draftSchema.methods.update = async function(data) {
  Object.assign(this, data);
  this.lastSavedAt = new Date();
  await this.save();
  return this;
};

// 实例方法：发布草稿
draftSchema.methods.publish = async function() {
  // 这里需要调用 Post 模型创建实际的内容
  // 由于循环引用，返回数据让服务层处理
  return {
    content: this.content,
    images: this.images,
    videos: this.videos,
    poll: this.poll,
    visibility: this.visibility,
    location: this.location,
    tags: this.tags,
    mentions: this.mentions
  };
};

module.exports = mongoose.model('Draft', draftSchema);

/**
 * 群组消息模型
 * 支持群聊消息存储
 */

const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 消息内容
  type: {
    type: String,
    enum: ['text', 'image', 'voice', 'video', 'file', 'system', 'notification'],
    default: 'text'
  },
  content: {
    type: String,
    default: ''
  },
  
  // 媒体文件
  media: {
    url: String,
    thumbnail: String,
    duration: Number, // 语音/视频时长（秒）
    size: Number // 文件大小（字节）
  },
  
  // 消息状态
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'deleted'],
    default: 'sent'
  },
  
  // 回复引用
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupMessage'
  },
  
  // @提及
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 表情回应
  reactions: [{
    emoji: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 已读状态
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 系统消息额外字段
  systemData: {
    action: String, // 'member_join', 'member_leave', 'admin_appoint', etc.
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    extra: mongoose.Schema.Types.Mixed
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
groupMessageSchema.index({ group: 1, createdAt: -1 });
groupMessageSchema.index({ sender: 1, createdAt: -1 });

// 添加表情回应
groupMessageSchema.methods.addReaction = async function(emoji, userId) {
  const existing = this.reactions.find(r => 
    r.emoji === emoji && r.user.toString() === userId.toString()
  );
  
  if (existing) {
    // 取消回应
    this.reactions = this.reactions.filter(r => 
      !(r.emoji === emoji && r.user.toString() === userId.toString())
    );
  } else {
    // 添加回应
    this.reactions.push({ emoji, user: userId, createdAt: new Date() });
  }
  
  await this.save();
  return this.reactions;
};

// 标记已读
groupMessageSchema.methods.markAsRead = async function(userId) {
  const existing = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existing) {
    this.readBy.push({ user: userId, readAt: new Date() });
    await this.save();
  }
};

module.exports = mongoose.model('GroupMessage', groupMessageSchema);

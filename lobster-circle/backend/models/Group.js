/**
 * 群组模型
 * 支持创建群组、加入/退出、群聊等功能
 */

const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  // 群组基本信息
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200
  },
  avatar: {
    type: String, // 群头像 URL
    default: ''
  },
  cover: {
    type: String, // 群封面 URL
    default: ''
  },
  
  // 群主和管理员
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // 成员列表
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'admin', 'owner'],
      default: 'member'
    },
    level: {
      type: Number, // 群内等级
      default: 1
    },
    points: {
      type: Number, // 群内积分
      default: 0
    }
  }],
  
  // 群设置
  settings: {
    joinType: {
      type: String,
      enum: ['open', 'approval', 'private'], // 公开/审核/私密
      default: 'open'
    },
    maxMembers: {
      type: Number,
      default: 500
    },
    allowMembersInvite: {
      type: Boolean,
      default: true
    },
    allowMembersPost: {
      type: Boolean,
      default: true
    },
    messageRetention: {
      type: Number, // 消息保留天数
      default: 365
    }
  },
  
  // 群统计
  stats: {
    memberCount: {
      type: Number,
      default: 1
    },
    messageCount: {
      type: Number,
      default: 0
    },
    activeToday: {
      type: Number,
      default: 0
    }
  },
  
  // 群标签
  tags: [{
    type: String,
    trim: true
  }],
  
  // 群公告
  announcement: {
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date,
    updatedAt: Date
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'disbanded', 'banned'],
    default: 'active'
  },
  
  // 地理位置（用于附近群组）
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  address: String,
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 创建地理位置索引
groupSchema.index({ location: '2dsphere' });
groupSchema.index({ tags: 1 });
groupSchema.index({ 'stats.memberCount': -1 });

// 虚拟字段：成员数量
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// 检查用户是否是成员
groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

// 检查用户是否是管理员或群主
groupSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member && (member.role === 'admin' || member.role === 'owner');
};

// 添加成员
groupSchema.methods.addMember = async function(userId, role = 'member') {
  if (this.isMember(userId)) {
    throw new Error('用户已是群成员');
  }
  
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('群成员已满');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    level: 1,
    points: 0
  });
  
  this.stats.memberCount = this.members.length;
  await this.save();
};

// 移除成员
groupSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString());
  if (memberIndex === -1) {
    throw new Error('用户不是群成员');
  }
  
  // 群主不能退出（需要先转让）
  if (this.members[memberIndex].role === 'owner') {
    throw new Error('群主不能退出，请先转让群主身份');
  }
  
  this.members.splice(memberIndex, 1);
  this.stats.memberCount = this.members.length;
  await this.save();
};

// 更新成员角色
groupSchema.methods.updateMemberRole = async function(userId, role) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    throw new Error('用户不是群成员');
  }
  
  member.role = role;
  await this.save();
};

// 更新群积分
groupSchema.methods.updateMemberPoints = async function(userId, points) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    throw new Error('用户不是群成员');
  }
  
  member.points += points;
  
  // 根据积分更新等级
  const newLevel = Math.floor(member.points / 100) + 1;
  if (newLevel > member.level) {
    member.level = newLevel;
  }
  
  await this.save();
};

module.exports = mongoose.model('Group', groupSchema);

/**
 * 投票模型
 * 支持创建投票、投票、统计结果
 */

const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  // 投票基本信息
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // 创建者
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 关联内容
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  
  // 选项
  options: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    image: {
      type: String, // 选项图片 URL
      default: ''
    },
    votes: {
      type: Number,
      default: 0
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  
  // 投票设置
  settings: {
    multiple: {
      type: Boolean, // 是否多选
      default: false
    },
    maxChoices: {
      type: Number, // 最多可选几项
      default: 1
    },
    anonymous: {
      type: Boolean, // 是否匿名投票
      default: false
    },
    allowChange: {
      type: Boolean, // 是否允许修改选择
      default: true
    }
  },
  
  // 投票者记录
  voters: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    choices: [Number], // 选择的选项索引
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // 时间设置
  expiresAt: {
    type: Date // 过期时间，null 表示永不过期
  },
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'expired', 'closed'],
    default: 'active'
  },
  
  // 统计
  totalVotes: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
pollSchema.index({ creator: 1, createdAt: -1 });
pollSchema.index({ postId: 1 });
pollSchema.index({ status: 1, expiresAt: 1 });

// 检查是否过期
pollSchema.methods.checkExpired = async function() {
  if (this.expiresAt && new Date() > this.expiresAt && this.status === 'active') {
    this.status = 'expired';
    await this.save();
    return true;
  }
  return false;
};

// 投票
pollSchema.methods.vote = async function(userId, choices) {
  // 检查是否过期
  if (await this.checkExpired()) {
    throw new Error('投票已过期');
  }
  
  // 检查状态
  if (this.status !== 'active') {
    throw new Error('投票已关闭');
  }
  
  // 验证选择
  const choiceArray = Array.isArray(choices) ? choices : [choices];
  
  if (!this.settings.multiple && choiceArray.length > 1) {
    throw new Error('该投票不支持多选');
  }
  
  if (choiceArray.length > this.settings.maxChoices) {
    throw new Error(`最多可选择${this.settings.maxChoices}项`);
  }
  
  // 检查选项有效性
  for (const choice of choiceArray) {
    if (choice < 0 || choice >= this.options.length) {
      throw new Error('无效的选项');
    }
  }
  
  // 检查是否已投票
  const existingVote = this.voters.find(v => v.user.toString() === userId.toString());
  
  if (existingVote) {
    if (!this.settings.allowChange) {
      throw new Error('你已投过票，不能修改选择');
    }
    
    // 减少原选项票数
    for (const prevChoice of existingVote.choices) {
      this.options[prevChoice].votes = Math.max(0, this.options[prevChoice].votes - 1);
    }
    
    // 更新选择
    existingVote.choices = choiceArray;
    existingVote.votedAt = new Date();
  } else {
    // 新投票
    this.voters.push({
      user: userId,
      choices: choiceArray,
      votedAt: new Date()
    });
  }
  
  // 增加新选项票数
  for (const choice of choiceArray) {
    this.options[choice].votes += 1;
  }
  
  // 更新总票数
  this.totalVotes = this.voters.length;
  
  await this.save();
  
  return this.getResults(userId);
};

// 获取投票结果（带百分比）
pollSchema.methods.getResults = function(userId) {
  const hasVoted = this.voters.some(v => v.user.toString() === userId?.toString());
  
  const results = this.options.map((option, index) => {
    const percentage = this.totalVotes > 0 
      ? ((option.votes / this.totalVotes) * 100).toFixed(1)
      : 0;
    
    return {
      index,
      text: option.text,
      image: option.image,
      votes: option.votes,
      percentage: parseFloat(percentage),
      isUserChoice: hasVoted ? this.voters.find(v => v.user.toString() === userId?.toString())?.choices.includes(index) : false
    };
  });
  
  return {
    title: this.title,
    description: this.description,
    totalVotes: this.totalVotes,
    status: this.status,
    expiresAt: this.expiresAt,
    settings: this.settings,
    results,
    hasVoted,
    canVote: this.status === 'active' && !this.expiresAt
  };
};

// 关闭投票
pollSchema.methods.close = async function() {
  this.status = 'closed';
  await this.save();
};

module.exports = mongoose.model('Poll', pollSchema);

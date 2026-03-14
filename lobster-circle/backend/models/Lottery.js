/**
 * 幸运抽奖模型
 */

const mongoose = require('mongoose');

const lotterySchema = new mongoose.Schema({
  // 抽奖活动名称
  name: {
    type: String,
    required: true
  },
  
  // 活动标识
  key: {
    type: String,
    required: true,
    unique: true
  },
  
  // 描述
  description: String,
  
  // 活动图片
  banner: String,
  
  // 抽奖类型
  type: {
    type: String,
    enum: ['daily', 'event', 'permanent'],
    default: 'daily'
  },
  
  // 单次消耗积分
  cost: {
    type: Number,
    default: 100
  },
  
  // 每日免费次数
  freeDaily: {
    type: Number,
    default: 1
  },
  
  // 奖池配置
  prizes: [{
    // 奖品名称
    name: String,
    
    // 奖品类型
    type: {
      type: String,
      enum: ['points', 'exp', 'item', 'frame', 'title', 'coupon'],
      required: true
    },
    
    // 奖品值
    value: {
      type: mongoose.Schema.Types.Mixed, // 积分数量/道具 ID 等
      required: true
    },
    
    // 图标
    icon: String,
    
    // 稀有度
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common'
    },
    
    // 权重（概率）
    weight: {
      type: Number,
      default: 1
    },
    
    // 总数量（0 表示无限）
    total: {
      type: Number,
      default: 0
    },
    
    // 剩余数量
    remaining: {
      type: Number,
      default: 0
    },
    
    // 是否已抽完
    soldOut: {
      type: Boolean,
      default: false
    }
  }],
  
  // 活动时间
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  
  // 状态
  status: {
    type: String,
    enum: ['active', 'inactive', 'ended'],
    default: 'active'
  },
  
  // 统计
  stats: {
    totalDraws: {
      type: Number,
      default: 0
    },
    totalPrizes: {
      type: Number,
      default: 0
    },
    uniqueParticipants: {
      type: Number,
      default: 0
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

lotterySchema.index({ key: 1 });
lotterySchema.index({ status: 1, type: 1 });

// 用户抽奖记录
const lotteryRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  lottery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lottery',
    required: true
  },
  
  // 获得奖品
  prize: {
    name: String,
    type: String,
    value: mongoose.Schema.Types.Mixed,
    rarity: String,
    icon: String
  },
  
  // 消耗积分
  cost: {
    type: Number,
    default: 0
  },
  
  // 是否免费
  isFree: {
    type: Boolean,
    default: false
  },
  
  // 抽奖时间
  drawnAt: {
    type: Date,
    default: Date.now
  },
  
  // 奖品领取状态
  claimed: {
    type: Boolean,
    default: true // 自动发放
  }
});

lotteryRecordSchema.index({ user: 1, drawnAt: -1 });
lotteryRecordSchema.index({ lottery: 1, drawnAt: -1 });

// 静态方法：获取活动奖池
lotterySchema.statics.getActiveLotteries = async function() {
  const now = new Date();
  
  return await this.find({
    status: 'active',
    startTime: { $lte: now },
    $or: [
      { endTime: null },
      { endTime: { $gte: now } }
    ]
  }).sort({ startTime: -1 });
};

// 实例方法：抽奖
lotterySchema.methods.draw = async function(user, isFree = false) {
  const User = mongoose.model('User');
  const LotteryRecord = mongoose.model('LotteryRecord');
  
  // 检查活动状态
  if (this.status !== 'active') {
    throw new Error('活动已结束');
  }
  
  const now = new Date();
  if (now < this.startTime || (this.endTime && now > this.endTime)) {
    throw new Error('活动不在进行中');
  }
  
  // 检查免费次数
  if (isFree) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const freeDraws = await LotteryRecord.countDocuments({
      user: user._id,
      lottery: this._id,
      isFree: true,
      drawnAt: { $gte: todayStart, $lt: todayEnd }
    });
    
    if (freeDraws >= this.freeDaily) {
      throw new Error('今日免费次数已用完');
    }
  } else {
    // 检查积分
    if (user.points < this.cost) {
      throw new Error('积分不足');
    }
    user.points -= this.cost;
  }
  
  // 计算总权重
  const availablePrizes = this.prizes.filter(p => !p.soldOut && p.remaining !== 0);
  if (availablePrizes.length === 0) {
    throw new Error('奖池已空');
  }
  
  const totalWeight = availablePrizes.reduce((sum, p) => sum + p.weight, 0);
  
  // 随机抽取
  let random = Math.random() * totalWeight;
  let selectedPrize = null;
  
  for (const prize of availablePrizes) {
    random -= prize.weight;
    if (random <= 0) {
      selectedPrize = prize;
      break;
    }
  }
  
  // 如果没有选中（理论上不会），给最后一个
  if (!selectedPrize) {
    selectedPrize = availablePrizes[availablePrizes.length - 1];
  }
  
  // 更新奖池
  const prizeIndex = this.prizes.findIndex(p => p.name === selectedPrize.name);
  if (prizeIndex !== -1 && this.prizes[prizeIndex].total > 0) {
    this.prizes[prizeIndex].remaining -= 1;
    if (this.prizes[prizeIndex].remaining <= 0) {
      this.prizes[prizeIndex].soldOut = true;
    }
  }
  
  // 更新统计
  this.stats.totalDraws += 1;
  this.stats.totalPrizes += 1;
  
  await this.save();
  await user.save();
  
  // 创建记录
  const record = new LotteryRecord({
    user: user._id,
    lottery: this._id,
    prize: {
      name: selectedPrize.name,
      type: selectedPrize.type,
      value: selectedPrize.value,
      rarity: selectedPrize.rarity,
      icon: selectedPrize.icon
    },
    cost: isFree ? 0 : this.cost,
    isFree,
    drawnAt: new Date()
  });
  
  await record.save();
  
  // 发放奖励
  await this.awardPrize(user, selectedPrize);
  
  return {
    prize: selectedPrize,
    record
  };
};

// 实例方法：发放奖励
lotterySchema.methods.awardPrize = async function(user, prize) {
  const UserLevel = mongoose.model('UserLevel');
  
  switch (prize.type) {
    case 'points':
      user.points += prize.value;
      await user.save();
      break;
      
    case 'exp':
      let userLevel = await UserLevel.findOne({ user: user._id });
      if (!userLevel) {
        userLevel = new UserLevel({ user: user._id });
      }
      await userLevel.addExp(prize.value);
      break;
      
    case 'frame':
      // 解锁头像框
      const AvatarFrame = mongoose.model('AvatarFrame');
      const frame = await AvatarFrame.findOne({ key: prize.value });
      if (frame) {
        const UserFrame = mongoose.model('UserFrame');
        await UserFrame.create({
          user: user._id,
          frame: frame._id,
          obtainedFrom: 'lottery'
        });
      }
      break;
      
    case 'title':
      user.title = prize.value;
      await user.save();
      break;
      
    // 其他类型可扩展
  }
};

module.exports = {
  Lottery: mongoose.model('Lottery', lotterySchema),
  LotteryRecord: mongoose.model('LotteryRecord', lotteryRecordSchema)
};

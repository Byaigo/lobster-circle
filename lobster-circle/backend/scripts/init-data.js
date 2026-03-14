/**
 * 初始化数据脚本
 * 用于创建默认主题、头像框、成就徽章、抽奖活动等
 * 
 * 使用方法：
 * node scripts/init-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 导入模型
const Theme = require('../models/Theme');
const { AvatarFrame } = require('../models/AvatarFrame');
const { Cover } = require('../models/Cover');
const { Achievement } = require('../models/Achievement');
const { Lottery } = require('../models/Lottery');
const UserLevel = require('../models/UserLevel');

// 数据库连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lobster-circle';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 连接成功'))
.catch((err) => {
  console.error('❌ MongoDB 连接失败:', err);
  process.exit(1);
});

// ============================================
// 默认主题
// ============================================
const defaultThemes = [
  {
    name: '龙虾红',
    key: 'default',
    description: '默认主题，热情似火',
    icon: '🦞',
    colors: {
      primary: '#ff6b6b',
      primaryLight: '#ff8e8e',
      primaryDark: '#ff4747',
      background: '#f5f5f5',
      backgroundDark: '#0f0f1a',
      surface: '#ffffff',
      surfaceDark: '#1a1a2e',
      textPrimary: '#333333',
      textPrimaryDark: '#ffffff',
      textSecondary: '#666666',
      textSecondaryDark: '#cccccc',
      textMuted: '#999999',
      textMutedDark: '#888888',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    isDark: false,
    isPremium: false,
    price: 0,
    order: 1
  },
  {
    name: '深海蓝',
    key: 'ocean-blue',
    description: '深邃海洋，宁静致远',
    icon: '🌊',
    colors: {
      primary: '#2196f3',
      primaryLight: '#64b5f6',
      primaryDark: '#1976d2',
      background: '#e3f2fd',
      backgroundDark: '#0d1b2a',
      surface: '#ffffff',
      surfaceDark: '#1b263b',
      textPrimary: '#1a237e',
      textPrimaryDark: '#e8eaf6',
      textSecondary: '#3949ab',
      textSecondaryDark: '#9fa8da',
      textMuted: '#7986cb',
      textMutedDark: '#5c6bc0',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    isDark: false,
    isPremium: false,
    price: 0,
    order: 2
  },
  {
    name: '翡翠绿',
    key: 'emerald-green',
    description: '清新自然，生机勃勃',
    icon: '🌿',
    colors: {
      primary: '#4caf50',
      primaryLight: '#81c784',
      primaryDark: '#388e3c',
      background: '#e8f5e9',
      backgroundDark: '#1b2e1b',
      surface: '#ffffff',
      surfaceDark: '#2e3b2e',
      textPrimary: '#1b5e20',
      textPrimaryDark: '#e8f5e9',
      textSecondary: '#2e7d32',
      textSecondaryDark: '#a5d6a7',
      textMuted: '#66bb6a',
      textMutedDark: '#81c784',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    isDark: false,
    isPremium: false,
    price: 0,
    order: 3
  },
  {
    name: '暗夜黑',
    key: 'dark-night',
    description: '深邃黑夜，护眼模式',
    icon: '🌙',
    colors: {
      primary: '#bb86fc',
      primaryLight: '#d1a4ff',
      primaryDark: '#9965f4',
      background: '#121212',
      backgroundDark: '#000000',
      surface: '#1e1e1e',
      surfaceDark: '#2d2d2d',
      textPrimary: '#ffffff',
      textPrimaryDark: '#ffffff',
      textSecondary: '#b0b0b0',
      textSecondaryDark: '#c0c0c0',
      textMuted: '#808080',
      textMutedDark: '#909090',
      success: '#03dac6',
      warning: '#ffb74d',
      error: '#cf6679',
      info: '#64b5f6'
    },
    isDark: true,
    isPremium: false,
    price: 0,
    order: 4
  },
  {
    name: '樱花粉',
    key: 'sakura-pink',
    description: '浪漫樱花，少女心爆棚',
    icon: '🌸',
    colors: {
      primary: '#f48fb1',
      primaryLight: '#ff80ab',
      primaryDark: '#f06292',
      background: '#fce4ec',
      backgroundDark: '#2d1b2e',
      surface: '#ffffff',
      surfaceDark: '#3d2b3e',
      textPrimary: '#880e4f',
      textPrimaryDark: '#fce4ec',
      textSecondary: '#ad1457',
      textSecondaryDark: '#f48fb1',
      textMuted: '#ec407a',
      textMutedDark: '#f06292',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    },
    isDark: false,
    isPremium: true,
    price: 500,
    order: 5
  },
  {
    name: '至尊金',
    key: 'premium-gold',
    description: '尊贵金色，VIP 专属',
    icon: '👑',
    colors: {
      primary: '#ffd700',
      primaryLight: '#ffe033',
      primaryDark: '#ffaa00',
      background: '#fff8e1',
      backgroundDark: '#1a1a00',
      surface: '#ffffff',
      surfaceDark: '#2d2d00',
      textPrimary: '#5d4037',
      textPrimaryDark: '#ffecb3',
      textSecondary: '#8d6e63',
      textSecondaryDark: '#ffe082',
      textMuted: '#a1887f',
      textMutedDark: '#ffd54f',
      success: '#ffd700',
      warning: '#ffb300',
      error: '#ff6f00',
      info: '#0288d1'
    },
    isDark: false,
    isPremium: true,
    price: 1000,
    order: 6
  }
];

// ============================================
// 头像框
// ============================================
const defaultAvatarFrames = [
  // 默认
  {
    name: '新手龙虾',
    key: 'default',
    description: '初始头像框',
    image: 'https://via.placeholder.com/200/ff6b6b/ffffff?text=Newbie',
    type: 'frame',
    rarity: 'common',
    acquisition: 'default',
    condition: '注册即送',
    isPremium: false,
    price: 0,
    duration: 0,
    order: 1
  },
  // 成就类
  {
    name: '人气之星',
    key: 'popularity-star',
    description: '获得 1000 个点赞',
    image: 'https://via.placeholder.com/200/ffd700/ffffff?text=Star',
    type: 'frame',
    rarity: 'rare',
    acquisition: 'achievement',
    condition: '累计获得 1000 个点赞',
    isPremium: false,
    price: 0,
    duration: 0,
    order: 10
  },
  {
    name: '社交达人',
    key: 'social-master',
    description: '拥有 500 个好友',
    image: 'https://via.placeholder.com/200/4caf50/ffffff?text=Social',
    type: 'frame',
    rarity: 'epic',
    acquisition: 'achievement',
    condition: '好友数量达到 500',
    isPremium: false,
    price: 0,
    duration: 0,
    order: 11
  },
  // VIP 类
  {
    name: 'VIP 贵族',
    key: 'vip-noble',
    description: 'VIP 专属头像框',
    image: 'https://via.placeholder.com/200/bb86fc/ffffff?text=VIP',
    type: 'frame',
    rarity: 'epic',
    acquisition: 'vip',
    condition: '开通 VIP 会员',
    isPremium: true,
    price: 0,
    duration: 0,
    order: 20
  },
  {
    name: '龙虾至尊',
    key: 'lobster-legend',
    description: '等级达到 100 级',
    image: 'https://via.placeholder.com/200/ff6b6b/ffffff?text=Legend',
    type: 'frame',
    rarity: 'legendary',
    acquisition: 'level',
    condition: '等级达到 100 级',
    isPremium: false,
    price: 0,
    duration: 0,
    order: 30
  },
  // 活动类
  {
    name: '新年限定',
    key: 'new-year-2026',
    description: '2026 新年限定头像框',
    image: 'https://via.placeholder.com/200/ff4444/ffffff?text=2026',
    type: 'frame',
    rarity: 'rare',
    acquisition: 'event',
    condition: '2026 年活动期间登录',
    isPremium: false,
    price: 0,
    duration: 365,
    order: 40
  }
];

// ============================================
// 封面图
// ============================================
const defaultCovers = [
  // 默认
  {
    name: '默认封面',
    key: 'default',
    description: '初始封面',
    image: 'https://via.placeholder.com/800x300/f5f5f5/999999?text=Default+Cover',
    thumbnail: 'https://via.placeholder.com/200x75/f5f5f5/999999?text=Default',
    category: 'default',
    isPremium: false,
    price: 0,
    order: 1
  },
  // 自然类
  {
    name: '海边日落',
    key: 'sunset-beach',
    description: '美丽的海边日落',
    image: 'https://via.placeholder.com/800x300/ff9a9e/ffffff?text=Sunset+Beach',
    thumbnail: 'https://via.placeholder.com/200x75/ff9a9e/ffffff?text=Sunset',
    category: 'nature',
    isPremium: false,
    price: 100,
    order: 10
  },
  {
    name: '青山绿水',
    key: 'green-mountain',
    description: '清新自然风光',
    image: 'https://via.placeholder.com/800x300/a8edea/333333?text=Green+Mountain',
    thumbnail: 'https://via.placeholder.com/200x75/a8edea/333333?text=Mountain',
    category: 'nature',
    isPremium: false,
    price: 100,
    order: 11
  },
  // 城市类
  {
    name: '都市夜景',
    key: 'city-night',
    description: '繁华都市夜景',
    image: 'https://via.placeholder.com/800x300/667eea/ffffff?text=City+Night',
    thumbnail: 'https://via.placeholder.com/200x75/667eea/ffffff?text=City',
    category: 'city',
    isPremium: false,
    price: 150,
    order: 20
  },
  // 抽象类
  {
    name: '渐变彩虹',
    key: 'gradient-rainbow',
    description: '彩色渐变背景',
    image: 'https://via.placeholder.com/800x300/f093fb/ffffff?text=Rainbow',
    thumbnail: 'https://via.placeholder.com/200x75/f093fb/ffffff?text=Rainbow',
    category: 'abstract',
    isPremium: false,
    price: 80,
    order: 30
  },
  // VIP 类
  {
    name: '尊贵金色',
    key: 'premium-gold',
    description: 'VIP 专属金色封面',
    image: 'https://via.placeholder.com/800x300/ffd700/333333?text=Gold+VIP',
    thumbnail: 'https://via.placeholder.com/200x75/ffd700/333333?text=Gold',
    category: 'default',
    isPremium: true,
    price: 0,
    order: 40
  }
];

// ============================================
// 成就徽章
// ============================================
const defaultAchievements = [
  // 社交类
  {
    name: '初来乍到',
    key: 'first-post',
    description: '发布第一条动态',
    icon: '🎉',
    badge: 'https://via.placeholder.com/100/ff6b6b/ffffff?text=First',
    category: 'social',
    rarity: 'common',
    type: 'once',
    condition: { type: 'post_count', operator: 'gte', value: 1 },
    reward: { exp: 50, points: 10 },
    hidden: false,
    order: 1
  },
  {
    name: '人气新星',
    key: 'popularity-rising',
    description: '获得 100 个点赞',
    icon: '⭐',
    badge: 'https://via.placeholder.com/100/ffd700/ffffff?text=Star',
    category: 'social',
    rarity: 'uncommon',
    type: 'once',
    condition: { type: 'like_count', operator: 'gte', value: 100 },
    reward: { exp: 200, points: 50, frame: 'popularity-star' },
    hidden: false,
    order: 2
  },
  {
    name: '社交达人',
    key: 'social-butterfly',
    description: '拥有 100 个好友',
    icon: '👥',
    badge: 'https://via.placeholder.com/100/4caf50/ffffff?text=Friends',
    category: 'social',
    rarity: 'rare',
    type: 'once',
    condition: { type: 'friend_count', operator: 'gte', value: 100 },
    reward: { exp: 500, points: 100 },
    hidden: false,
    order: 3
  },
  // 内容类
  {
    name: '多产作家',
    key: 'prolific-writer',
    description: '发布 50 条动态',
    icon: '✍️',
    badge: 'https://via.placeholder.com/100/2196f3/ffffff?text=Writer',
    category: 'content',
    rarity: 'uncommon',
    type: 'once',
    condition: { type: 'post_count', operator: 'gte', value: 50 },
    reward: { exp: 300, points: 80 },
    hidden: false,
    order: 10
  },
  {
    name: '评论之王',
    key: 'comment-king',
    description: '发送 500 条评论',
    icon: '💬',
    badge: 'https://via.placeholder.com/100/ff9800/ffffff?text=Comment',
    category: 'content',
    rarity: 'rare',
    type: 'once',
    condition: { type: 'comment_count', operator: 'gte', value: 500 },
    reward: { exp: 400, points: 100 },
    hidden: false,
    order: 11
  },
  // 活动类
  {
    name: '签到达人',
    key: 'checkin-master',
    description: '连续签到 30 天',
    icon: '📅',
    badge: 'https://via.placeholder.com/100/9c27b0/ffffff?text=Checkin',
    category: 'activity',
    rarity: 'rare',
    type: 'once',
    condition: { type: 'login_days', operator: 'gte', value: 30 },
    reward: { exp: 500, points: 200 },
    hidden: false,
    order: 20
  },
  // 特殊类
  {
    name: '龙虾至尊',
    key: 'lobster-god',
    description: '等级达到 100 级',
    icon: '🦞',
    badge: 'https://via.placeholder.com/100/ff6b6b/ffffff?text=God',
    category: 'special',
    rarity: 'legendary',
    type: 'once',
    condition: { type: 'level', operator: 'gte', value: 100 },
    reward: { exp: 10000, points: 5000, frame: 'lobster-legend', title: '龙虾至尊' },
    hidden: false,
    order: 30
  }
];

// ============================================
// 抽奖活动
// ============================================
const defaultLotteries = [
  {
    name: '每日幸运抽奖',
    key: 'daily-lucky',
    description: '每天免费抽一次，赢取丰厚奖品！',
    banner: 'https://via.placeholder.com/800x200/ff6b6b/ffffff?text=Daily+Lucky+Draw',
    type: 'daily',
    cost: 100,
    freeDaily: 1,
    prizes: [
      {
        name: '谢谢参与',
        type: 'points',
        value: 0,
        icon: '😅',
        rarity: 'common',
        weight: 50,
        total: 0,
        remaining: 0
      },
      {
        name: '10 积分',
        type: 'points',
        value: 10,
        icon: '💰',
        rarity: 'common',
        weight: 30,
        total: 0,
        remaining: 0
      },
      {
        name: '50 积分',
        type: 'points',
        value: 50,
        icon: '💰💰',
        rarity: 'uncommon',
        weight: 15,
        total: 0,
        remaining: 0
      },
      {
        name: '100 积分',
        type: 'points',
        value: 100,
        icon: '💰💰💰',
        rarity: 'rare',
        weight: 5,
        total: 0,
        remaining: 0
      },
      {
        name: '200 经验',
        type: 'exp',
        value: 200,
        icon: '📈',
        rarity: 'uncommon',
        weight: 10,
        total: 0,
        remaining: 0
      },
      {
        name: '新手头像框',
        type: 'frame',
        value: 'default',
        icon: '🖼️',
        rarity: 'rare',
        weight: 3,
        total: 100,
        remaining: 100
      },
      {
        name: 'VIP 头像框（7 天）',
        type: 'frame',
        value: 'vip-noble',
        icon: '👑',
        rarity: 'epic',
        weight: 1,
        total: 10,
        remaining: 10
      }
    ],
    status: 'active'
  }
];

// ============================================
// 执行初始化
// ============================================
async function initializeData() {
  console.log('\n🚀 开始初始化数据...\n');

  try {
    // 1. 初始化主题
    console.log('📦 初始化主题...');
    for (const theme of defaultThemes) {
      await Theme.findOneAndUpdate({ key: theme.key }, theme, { upsert: true, new: true });
      console.log(`  ✅ ${theme.name}`);
    }

    // 2. 初始化头像框
    console.log('\n📦 初始化头像框...');
    for (const frame of defaultAvatarFrames) {
      await AvatarFrame.findOneAndUpdate({ key: frame.key }, frame, { upsert: true, new: true });
      console.log(`  ✅ ${frame.name}`);
    }

    // 3. 初始化封面图
    console.log('\n📦 初始化封面图...');
    for (const cover of defaultCovers) {
      await Cover.findOneAndUpdate({ key: cover.key }, cover, { upsert: true, new: true });
      console.log(`  ✅ ${cover.name}`);
    }

    // 4. 初始化成就
    console.log('\n📦 初始化成就徽章...');
    for (const achievement of defaultAchievements) {
      await Achievement.findOneAndUpdate({ key: achievement.key }, achievement, { upsert: true, new: true });
      console.log(`  ✅ ${achievement.name} (${achievement.rarity})`);
    }

    // 5. 初始化抽奖活动
    console.log('\n📦 初始化抽奖活动...');
    for (const lottery of defaultLotteries) {
      await Lottery.findOneAndUpdate({ key: lottery.key }, lottery, { upsert: true, new: true });
      console.log(`  ✅ ${lottery.name}`);
    }

    console.log('\n✅ 数据初始化完成！\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initializeData();

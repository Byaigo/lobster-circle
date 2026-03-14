/**
 * 用户主题模型
 * 支持多套主题皮肤
 */

const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  // 主题名称
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  // 主题标识
  key: {
    type: String,
    required: true,
    unique: true
  },
  
  // 主题描述
  description: String,
  
  // 主题图标
  icon: String,
  
  // 颜色配置
  colors: {
    // 主色调
    primary: {
      type: String,
      default: '#ff6b6b'
    },
    primaryLight: String,
    primaryDark: String,
    
    // 背景色
    background: {
      type: String,
      default: '#f5f5f5'
    },
    backgroundDark: {
      type: String,
      default: '#0f0f1a'
    },
    surface: {
      type: String,
      default: '#ffffff'
    },
    surfaceDark: {
      type: String,
      default: '#1a1a2e'
    },
    
    // 文字颜色
    textPrimary: {
      type: String,
      default: '#333333'
    },
    textPrimaryDark: {
      type: String,
      default: '#ffffff'
    },
    textSecondary: {
      type: String,
      default: '#666666'
    },
    textSecondaryDark: {
      type: String,
      default: '#cccccc'
    },
    textMuted: {
      type: String,
      default: '#999999'
    },
    textMutedDark: {
      type: String,
      default: '#888888'
    },
    
    // 状态颜色
    success: {
      type: String,
      default: '#4caf50'
    },
    warning: {
      type: String,
      default: '#ff9800'
    },
    error: {
      type: String,
      default: '#f44336'
    },
    info: {
      type: String,
      default: '#2196f3'
    }
  },
  
  // 是否为深色主题
  isDark: {
    type: Boolean,
    default: false
  },
  
  // 是否付费主题
  isPremium: {
    type: Boolean,
    default: false
  },
  
  // 价格（积分）
  price: {
    type: Number,
    default: 0
  },
  
  // 预览图
  preview: String,
  
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

themeSchema.index({ key: 1 });
themeSchema.index({ status: 1, order: 1 });

// 静态方法：获取所有可用主题
themeSchema.statics.getAvailableThemes = async function() {
  return await this.find({ status: 'active' }).sort({ order: 1, name: 1 });
};

// 静态方法：获取默认主题
themeSchema.statics.getDefaultTheme = async function() {
  return await this.findOne({ key: 'default' });
};

// 静态方法：获取深色主题
themeSchema.statics.getDarkThemes = async function() {
  return await this.find({ status: 'active', isDark: true }).sort({ order: 1 });
};

// 静态方法：获取浅色主题
themeSchema.statics.getLightThemes = async function() {
  return await this.find({ status: 'active', isDark: false }).sort({ order: 1 });
};

module.exports = mongoose.model('Theme', themeSchema);

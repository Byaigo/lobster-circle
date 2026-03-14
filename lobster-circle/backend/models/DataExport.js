/**
 * 数据导出模型
 * 用户数据导出请求
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

const dataExportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 导出状态
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // 导出类型
  exportType: {
    type: String,
    enum: ['all', 'posts', 'comments', 'messages', 'photos', 'profile'],
    default: 'all'
  },
  
  // 导出格式
  format: {
    type: String,
    enum: ['json', 'html', 'zip'],
    default: 'json'
  },
  
  // 导出文件路径
  filePath: String,
  
  // 文件大小（字节）
  fileSize: Number,
  
  // 下载 URL
  downloadUrl: String,
  
  // 过期时间
  expiresAt: Date,
  
  // 进度
  progress: {
    current: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  
  // 错误信息
  error: String,
  
  // 请求时间
  requestedAt: {
    type: Date,
    default: Date.now
  },
  
  // 完成时间
  completedAt: Date,
  
  // 下载次数
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 索引
dataExportSchema.index({ user: 1, status: 1 });
dataExportSchema.index({ expiresAt: 1 });

// 静态方法：创建导出请求
dataExportSchema.statics.createExport = async function(userId, exportType = 'all', format = 'json') {
  // 检查是否有进行中的导出
  const existing = await this.findOne({
    user: userId,
    status: { $in: ['pending', 'processing'] }
  });
  
  if (existing) {
    throw new Error('已有导出任务正在进行中');
  }
  
  const export_job = new this({
    user: userId,
    exportType,
    format
  });
  
  await export_job.save();
  return export_job;
};

// 实例方法：更新进度
dataExportSchema.methods.updateProgress = async function(current, total) {
  this.progress.current = current;
  this.progress.total = total;
  this.progress.percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  await this.save();
};

// 实例方法：标记完成
dataExportSchema.methods.markCompleted = async function(filePath, fileSize) {
  this.status = 'completed';
  this.filePath = filePath;
  this.fileSize = fileSize;
  this.completedAt = new Date();
  this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天后过期
  this.downloadUrl = `/api/data-export/download/${this._id}`;
  await this.save();
};

// 实例方法：标记失败
dataExportSchema.methods.markFailed = async function(error) {
  this.status = 'failed';
  this.error = error.message || error.toString();
  await this.save();
};

// 实例方法：增加下载次数
dataExportSchema.methods.incrementDownload = async function() {
  this.downloadCount += 1;
  await this.save();
};

// 静态方法：清理过期导出
dataExportSchema.statics.cleanExpired = async function() {
  const now = new Date();
  
  const expiredExports = await this.find({
    expiresAt: { $lte: now },
    filePath: { $exists: true }
  });
  
  // 删除文件
  for (const exp of expiredExports) {
    try {
      if (exp.filePath && fs.existsSync(exp.filePath)) {
        await fs.unlink(exp.filePath);
      }
      await this.findByIdAndDelete(exp._id);
    } catch (error) {
      console.error('清理过期导出失败:', error);
    }
  }
  
  return expiredExports.length;
};

// 导出数据打包器
dataExportSchema.statics.packageUserData = async function(userId, exportType) {
  const User = mongoose.model('User');
  const Post = mongoose.model('Post');
  const Comment = mongoose.model('Comment');
  // ... 其他模型
  
  const userData = {};
  
  // 用户资料
  if (exportType === 'all' || exportType === 'profile') {
    const user = await User.findById(userId).select('-password');
    userData.profile = user;
  }
  
  // 动态
  if (exportType === 'all' || exportType === 'posts') {
    const posts = await Post.find({ author: userId }).sort({ createdAt: -1 });
    userData.posts = posts;
  }
  
  // 评论
  if (exportType === 'all' || exportType === 'comments') {
    const Comment = mongoose.model('Comment');
    const comments = await Comment.find({ author: userId }).sort({ createdAt: -1 });
    userData.comments = comments;
  }
  
  return userData;
};

module.exports = mongoose.model('DataExport', dataExportSchema);

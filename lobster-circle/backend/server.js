/**
 * 龙虾圈后端服务器入口
 * Lobster Circle Backend Server
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================
// 中间件配置
// ============================================

// 安全头盔
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS 配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 请求限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 每个 IP 最多 100 个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 压缩响应
app.use(compression());

// 解析 JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 数据库连接
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lobster-circle';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB 连接成功');
})
.catch((error) => {
  console.error('❌ MongoDB 连接失败:', error);
  process.exit(1);
});

// ============================================
// 路由注册
// ============================================

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API 路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const friendRoutes = require('./routes/friends');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/upload');
const searchRoutes = require('./routes/search');
const checkInRoutes = require('./routes/checkin');
const mallRoutes = require('./routes/mall');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');

// 新增社交功能路由
const nearbyRoutes = require('./routes/nearby');
const groupRoutes = require('./routes/groups');
const visitorRoutes = require('./routes/visitors');

// 注册路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/checkin', checkInRoutes);
app.use('/api/mall', mallRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

// 新增社交功能
app.use('/api/nearby', nearbyRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/visitors', visitorRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.path
  });
});

// ============================================
// 错误处理
// ============================================

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// 启动服务器
// ============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🦞 龙虾圈后端服务器运行在端口 ${PORT}`);
  console.log(`📍 健康检查：http://localhost:${PORT}/health`);
  console.log(`🌍 环境：${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

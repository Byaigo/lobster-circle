/**
 * 🦞 龙虾圈后端服务器
 * 技术栈：Express + Socket.io + MongoDB + JWT
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const { securityMiddleware, loginLimiter, registerLimiter } = require('./middleware/security');
const notificationService = require('./services/notificationService');

// 加载环境变量
dotenv.config();

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');
const friendRoutes = require('./routes/friends');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const configRoutes = require('./routes/config');
const sensitiveWordRoutes = require('./routes/sensitive-words');
const checkInRoutes = require('./routes/checkin');
const analyticsRoutes = require('./routes/analytics');
const storageRoutes = require('./routes/storage');
const feedbackRoutes = require('./routes/feedback');
const versionRoutes = require('./routes/version');
const pointsMallRoutes = require('./routes/points-mall');
const loginLogsRoutes = require('./routes/login-logs');
const passwordResetRoutes = require('./routes/password-reset');
const updateRoutes = require('./routes/update');
const cacheRoutes = require('./routes/cache');
const searchRoutes = require('./routes/search');

// 导入中间件
const { contentFilter, commentFilter, maintenanceCheck } = require('./middleware/contentFilter');

// 初始化 Express
const app = express();
const server = http.createServer(app);

// 初始化 Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('Socket 连接:', socket.id);

  // 用户认证后加入
  socket.on('authenticate', ({ userId }) => {
    if (userId) {
      socket.join(`user:${userId}`);
      notificationService.addUser(userId, socket.id);
      socket.emit('authenticated', { success: true });
      
      // 广播在线状态
      io.emit('user_status', {
        userId,
        online: true,
        onlineCount: notificationService.getOnlineCount()
      });
    }
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('Socket 断开:', socket.id);
    
    // 从所有房间移除
    for (const [userId, socketIds] of notificationService.notifications) {
      if (socketIds.has(socket.id)) {
        notificationService.removeUser(userId, socket.id);
        io.emit('user_status', {
          userId,
          online: false,
          onlineCount: notificationService.getOnlineCount()
        });
        break;
      }
    }
  });

  // 错误处理
  socket.on('error', (error) => {
    console.error('Socket 错误:', error);
  });
});

// 中间件
app.use(securityMiddleware); // 安全中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(logger); // 请求日志

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB 连接成功'))
.catch(err => console.error('❌ MongoDB 连接失败:', err));

// 全局中间件
app.use(maintenanceCheck); // 维护模式检查

// 全局中间件
app.use(maintenanceCheck); // 维护模式检查

// API 路由（带限流）
app.use('/api/auth/register', registerLimiter, authRoutes);
app.use('/api/auth/login', loginLimiter, authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/config', configRoutes);
app.use('/api/sensitive-words', sensitiveWordRoutes);
app.use('/api/checkin', checkInRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/version', versionRoutes);
app.use('/api/points-mall', pointsMallRoutes);
app.use('/api/login-logs', loginLogsRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/update', updateRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/errors', errorRoutes);

// 错误处理（必须在最后）
app.use(notFoundHandler);
app.use(errorHandler);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🦞 龙虾圈后端运行中' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// Socket.io 连接处理
const activeUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('🔌 用户连接:', socket.id);

  // 用户上线
  socket.on('user_online', (userId) => {
    activeUsers.set(userId, socket.id);
    io.emit('user_status', { userId, online: true });
    console.log(`用户 ${userId} 上线`);
  });

  // 发送私信
  socket.on('send_message', (data) => {
    const { from, to, content, type } = data;
    
    // 保存消息到数据库（稍后实现）
    console.log(`收到消息：${from} -> ${to}: ${content}`);
    
    // 发送给接收者
    const recipientSocketId = activeUsers.get(to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', {
        from,
        to,
        content,
        type: type || 'text',
        timestamp: new Date().toISOString()
      });
    }
    
    // 发送确认给发送者
    socket.emit('message_sent', {
      status: 'sent',
      timestamp: new Date().toISOString()
    });
  });

  // 已读回执
  socket.on('message_read', (data) => {
    const { messageId, from, to } = data;
    const senderSocketId = activeUsers.get(from);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message_read_receipt', { messageId });
    }
  });

  // 用户下线
  socket.on('disconnect', () => {
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        io.emit('user_status', { userId, online: false });
        console.log(`用户 ${userId} 下线`);
        break;
      }
    }
  });
});

// 导出 io 供其他模块使用
module.exports = { app, io };

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🦞 龙虾圈后端服务器运行在端口 ${PORT}`);
  console.log(`📡 WebSocket 已启用`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`🔔 实时通知服务已启动`);
});

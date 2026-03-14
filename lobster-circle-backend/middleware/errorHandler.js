/**
 * 🦞 生产级错误处理中间件
 * 功能：统一错误格式 + Sentry 准备 + 错误分类 + 安全堆栈
 */

const log = require('./logger');

/**
 * 统一错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 生成错误 ID（用于追踪）
  const errorId = log.generateRequestId();
  
  // 记录完整错误（包含堆栈）
  log.error('Unhandled error', {
    errorId,
    requestId: req.requestId,
    message: err.message,
    stack: err.stack,
    user: req.user?.id,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    log.warn('Validation error', {
      errorId,
      errors,
      path: req.path,
    });
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: errors,
        errorId, // 返回错误 ID 方便用户反馈时提供
      },
    });
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    log.warn('Duplicate key error', {
      errorId,
      field,
      value: err.keyValue?.[field],
    });
    
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field}已存在`,
        errorId,
      },
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    log.warn('Invalid JWT token', {
      errorId,
      userId: req.user?.id,
    });
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token 无效',
        errorId,
      },
    });
  }

  // Token 过期
  if (err.name === 'TokenExpiredError') {
    log.warn('Expired JWT token', {
      errorId,
      userId: req.user?.id,
      expiredAt: err.expiredAt,
    });
    
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token 已过期',
        errorId,
      },
    });
  }

  // Mongoose 未找到
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    log.warn('Invalid ObjectId', {
      errorId,
      path: req.path,
    });
    
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '资源不存在',
        errorId,
      },
    });
  }

  // 网络错误（ECONNRESET 等）
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    // 这些通常是客户端断开连接，不需要返回响应
    log.warn('Client disconnected', {
      errorId,
      code: err.code,
      path: req.path,
    });
    return;
  }

  // 默认错误处理
  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  log.error('Internal server error', {
    errorId,
    status,
    stack: err.stack,
  });
  
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isProduction ? '服务器内部错误' : err.message,
      errorId, // 始终返回错误 ID，方便追踪
      // 开发环境显示堆栈
      stack: isProduction ? undefined : err.stack,
    },
  });
};

/**
 * 404 处理
 */
const notFoundHandler = (req, res, next) => {
  const requestId = log.generateRequestId();
  
  log.warn('Route not found', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  });
  
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路由 ${req.originalUrl} 不存在`,
      requestId,
    },
  });
};

/**
 * 异步处理器包装器
 * 自动捕获 async 函数中的错误
 * 使用方式：router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { 
  errorHandler, 
  notFoundHandler,
  asyncHandler,
};

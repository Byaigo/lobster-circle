/**
 * 统一错误处理中间件
 */

const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
    user: req.user?.id
  });

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: errors
      }
    });
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field}已存在`
      }
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token 无效'
      }
    });
  }

  // Token 过期
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token 已过期'
      }
    });
  }

  // Mongoose 未找到
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: '资源不存在'
      }
    });
  }

  // 默认错误
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
};

// 404 处理
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路由 ${req.originalUrl} 不存在`
    }
  });
};

module.exports = { errorHandler, notFoundHandler };

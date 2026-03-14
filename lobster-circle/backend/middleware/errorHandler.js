/**
 * 统一错误处理中间件
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = '请求参数错误', code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = '未授权访问', code = 'UNAUTHORIZED') {
    return new AppError(message, 401, code);
  }

  static forbidden(message = '禁止访问', code = 'FORBIDDEN') {
    return new AppError(message, 403, code);
  }

  static notFound(message = '资源不存在', code = 'NOT_FOUND') {
    return new AppError(message, 404, code);
  }

  static conflict(message = '资源冲突', code = 'CONFLICT') {
    return new AppError(message, 409, code);
  }

  static tooManyRequests(message = '请求过于频繁', code = 'TOO_MANY_REQUESTS') {
    return new AppError(message, 429, code);
  }

  static internal(message = '服务器内部错误', code = 'INTERNAL_ERROR') {
    return new AppError(message, 500, code);
  }
}

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || '服务器内部错误';
  let code = err.code || 'INTERNAL_ERROR';

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const messages = Object.values(err.errors).map(e => e.message);
    message = messages.join('; ');
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue)[0];
    message = `${field} 已存在`;
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = '令牌无效';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = '令牌已过期';
  }

  // 开发环境返回堆栈
  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode
    }
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details;
  }

  // 记录错误日志
  console.error(`[Error] ${code}: ${message}`, {
    path: req.path,
    method: req.method,
    statusCode,
    stack: err.stack
  });

  res.status(statusCode).json(errorResponse);
};

// 异步处理包装器（避免 try-catch）
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler
};

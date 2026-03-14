/**
 * 性能优化中间件
 */

const NodeCache = require('node-cache');

// 创建缓存实例
const cache = new NodeCache({
  stdTTL: 300, // 默认 5 分钟
  checkperiod: 60 // 每分钟检查过期
});

// 缓存中间件
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // 仅对 GET 请求缓存
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    const cachedData = cache.get(key);

    if (cachedData) {
      // 命中缓存
      return res.json(cachedData);
    }

    // 覆盖 res.json 方法
    const originalJson = res.json;
    res.json = (data) => {
      // 仅缓存成功响应
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, duration);
      }
      return originalJson.call(res, data);
    };

    next();
  };
};

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[Request] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};

// 限流中间件（内存版）
const rateLimitStore = new Map();

const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 分钟
    max = 100, // 最多请求数
    message = '请求过于频繁，请稍后再试'
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `rate:${ip}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);

    if (!record) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
      return next();
    }

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count++;

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: {
          message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }
      });
    }

    next();
  };
};

// 清理限流存储（每小时）
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 3600000);

// 响应压缩中间件（如果未使用 compression 包）
const compression = (req, res, next) => {
  if (!res.headersSent) {
    res.setHeader('X-Response-Time', Date.now());
  }
  next();
};

module.exports = {
  cache,
  cacheMiddleware,
  requestLogger,
  rateLimit,
  compression
};

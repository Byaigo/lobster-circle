/**
 * 请求限流中间件
 */

const rateLimitStore = new Map();

const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 分钟
    max = 100, // 最多 100 次请求
    message = '请求过于频繁，请稍后再试',
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${ip}`;

    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now - record.start > windowMs) {
      // 新窗口
      rateLimitStore.set(key, {
        start: now,
        count: 1,
      });
      next();
    } else if (record.count >= max) {
      // 超过限制
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil((record.start + windowMs - now) / 1000),
      });
    } else {
      // 增加计数
      record.count++;
      rateLimitStore.set(key, record);
      next();
    }

    // 清理过期记录
    setTimeout(() => {
      rateLimitStore.delete(key);
    }, windowMs);
  };
};

// 登录限流（更严格）
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5, // 最多 5 次登录尝试
  message: '登录尝试次数过多，请 15 分钟后再试',
});

// 注册限流
const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 3, // 最多 3 次注册
  message: '注册次数过多，请 1 小时后再试',
});

// API 通用限流
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max = 100, // 最多 100 次请求
  message: '请求过于频繁，请稍后再试',
});

module.exports = {
  rateLimit,
  loginRateLimit,
  registerRateLimit,
  apiRateLimit,
};

/**
 * Redis 缓存中间件
 */

const NodeCache = require('node-cache');

// 内存缓存（5 分钟默认过期）
const cache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 60,
  useClones: false 
});

// 缓存中间件
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    const cachedData = cache.get(key);

    if (cachedData) {
      // 命中缓存
      return res.json(cachedData);
    }

    // 重写 res.json 以缓存响应
    const originalJson = res.json;
    res.json = (data) => {
      // 只缓存成功响应
      if (res.statusCode === 200) {
        cache.set(key, data, duration);
      }
      return originalJson.call(res, data);
    };

    next();
  };
};

// 清除缓存
const clearCache = (pattern) => {
  if (pattern) {
    const keys = cache.keys().filter(key => key.includes(pattern));
    cache.del(keys);
  } else {
    cache.flushAll();
  }
};

// 获取缓存统计
const getCacheStats = () => {
  return cache.getStats();
};

module.exports = {
  cacheMiddleware,
  clearCache,
  getCacheStats,
  cache,
};

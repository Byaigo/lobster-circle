/**
 * 请求日志中间件
 */

const logger = (req, res, next) => {
  const start = Date.now();
  
  // 响应结束后记录
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id
    });
  });
  
  next();
};

module.exports = logger;

/**
 * 🦞 生产级日志中间件
 * 功能：结构化日志 + 性能追踪 + 请求 ID + 日志轮转准备
 */

const fs = require('fs');
const path = require('path');

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

// 当前日志级别（从环境变量读取）
const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'] ?? LOG_LEVELS.INFO;

// 日志目录
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 生成唯一请求 ID
const generateRequestId = () => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

// 格式化日志
const formatLog = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(logEntry);
};

// 写入日志到文件
const writeToFile = (filename, logEntry) => {
  const logPath = path.join(logDir, filename);
  const logLine = logEntry + '\n';
  fs.appendFile(logPath, logLine, (err) => {
    if (err) console.error('Failed to write log:', err);
  });
};

// 日志记录函数
const log = (level, message, meta = {}) => {
  const levelNum = LOG_LEVELS[level];
  if (levelNum === undefined || levelNum > currentLogLevel) return;

  const logEntry = formatLog(level, message, meta);
  
  // 控制台输出（带颜色）
  const colors = {
    ERROR: '\x1b[31m', // 红
    WARN: '\x1b[33m',  // 黄
    INFO: '\x1b[36m',  // 青
    DEBUG: '\x1b[35m', // 紫
  };
  const reset = '\x1b[0m';
  const color = colors[level] || '';
  
  console.log(`${color}[${level}]${reset} ${message}`, meta);
  
  // 写入文件（按日期分文件）
  const date = new Date().toISOString().split('T')[0];
  writeToFile(`app-${date}.log`, logEntry);
  
  // 错误日志单独记录
  if (level === 'ERROR' || level === 'WARN') {
    writeToFile(`error-${date}.log`, logEntry);
  }
};

// 请求日志中间件
const logger = (req, res, next) => {
  const start = Date.now();
  const requestId = generateRequestId();
  
  // 将请求 ID 添加到响应头
  res.setHeader('X-Request-ID', requestId);
  req.requestId = requestId;
  
  // 记录请求开始
  log('DEBUG', 'Request started', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
  });

  // 响应结束后记录
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    
    log(logLevel, 'Request completed', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    });
  });

  // 记录响应错误
  res.on('error', (err) => {
    log('ERROR', 'Response error', {
      requestId,
      error: err.message,
      stack: err.stack,
    });
  });
  
  next();
};

// 导出日志函数（供其他模块使用）
log.error = (message, meta) => log('ERROR', message, meta);
log.warn = (message, meta) => log('WARN', message, meta);
log.info = (message, meta) => log('INFO', message, meta);
log.debug = (message, meta) => log('DEBUG', message, meta);

// 导出工具函数
log.generateRequestId = generateRequestId;
log.logDir = logDir;

module.exports = log;

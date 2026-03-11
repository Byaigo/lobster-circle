/**
 * 安全中间件
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// CORS 配置
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 60 * 60 * 24 // 24 小时
};

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 次请求
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录限流（更严格）
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 5, // 最多 5 次登录尝试
  message: {
    success: false,
    error: {
      code: 'LOGIN_LIMIT_EXCEEDED',
      message: '登录尝试次数过多，请 15 分钟后再试'
    }
  },
  skipSuccessfulRequests: true,
});

// 注册限流
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 3, // 最多 3 次注册
  message: {
    success: false,
    error: {
      code: 'REGISTER_LIMIT_EXCEEDED',
      message: '注册次数过多，请 1 小时后再试'
    }
  },
});

// 安全中间件集合
const securityMiddleware = [
  // Helmet 安全头
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
  
  // XSS 防护
  xss(),
  
  // 防止参数污染
  hpp(),
  
  // CORS
  cors(corsOptions),
  
  // 通用限流
  limiter,
];

module.exports = {
  securityMiddleware,
  loginLimiter,
  registerLimiter,
  corsOptions,
};

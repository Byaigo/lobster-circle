const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const auth = require('../middleware/auth');

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (username.length < 2 || username.length > 20) {
      return res.status(400).json({ error: '用户名长度 2-20 个字符' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 个字符' });
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: '用户名已被使用' });
    }

    // 创建用户
    const user = new User({ username, password });
    await user.save();

    // 生成 Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    res.status(201).json({
      message: '注册成功',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    // 获取客户端信息
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // 简单设备检测
    let device = 'unknown';
    if (/mobile/i.test(userAgent)) device = 'mobile';
    else if (/tablet/i.test(userAgent)) device = 'tablet';
    else if (/desktop/i.test(userAgent)) device = 'desktop';

    // 更新在线状态
    user.isOnline = true;
    user.lastSeen = new Date();
    user.lastLoginIp = ip;
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // 记录登录日志
    await LoginLog.create({
      userId: user._id,
      ip,
      userAgent,
      device,
      status: 'success'
    });

    res.json({
      message: '登录成功',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 登出
router.post('/logout', auth, async (req, res) => {
  try {
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    await req.user.save();
    res.json({ message: '登出成功' });
  } catch (error) {
    res.status(500).json({ error: '登出失败' });
  }
});

module.exports = router;

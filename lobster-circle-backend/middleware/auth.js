const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // 从 Header 获取 Token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '未授权，请先登录' });
    }

    // 验证 Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    // 附加用户信息到请求
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth 中间件错误:', error);
    res.status(401).json({ error: 'Token 无效或已过期' });
  }
};

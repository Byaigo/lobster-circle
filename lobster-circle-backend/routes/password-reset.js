/**
 * 密码找回/重置 API
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 临时存储重置令牌（生产环境应该用 Redis）
const resetTokens = new Map();

// 请求密码重置
router.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      // 为了安全，不提示用户是否存在
      return res.json({ message: '如果账号存在，重置链接将发送到您的邮箱' });
    }

    // 生成重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // 存储令牌（24 小时过期）
    resetTokens.set(resetTokenHash, {
      userId: user._id,
      expires: Date.now() + 24 * 60 * 60 * 1000
    });

    // TODO: 发送邮件（需要配置邮件服务）
    // 暂时返回令牌给用户（仅用于测试）
    res.json({
      message: '密码重置链接已生成',
      resetToken, // 生产环境应该通过邮件发送
      note: '生产环境应该通过邮件发送此令牌'
    });
  } catch (error) {
    res.status(500).json({ error: '请求失败' });
  }
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: '参数不完整' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: '密码至少 6 个字符' });
    }

    // 验证令牌
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const tokenData = resetTokens.get(resetTokenHash);
    if (!tokenData) {
      return res.status(400).json({ error: '无效的重置令牌' });
    }

    if (Date.now() > tokenData.expires) {
      resetTokens.delete(resetTokenHash);
      return res.status(400).json({ error: '重置令牌已过期' });
    }

    // 更新密码
    const user = await User.findById(tokenData.userId);
    if (!user) {
      resetTokens.delete(resetTokenHash);
      return res.status(404).json({ error: '用户不存在' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // 删除令牌
    resetTokens.delete(resetTokenHash);

    res.json({ message: '密码已重置' });
  } catch (error) {
    res.status(500).json({ error: '重置失败' });
  }
});

module.exports = router;

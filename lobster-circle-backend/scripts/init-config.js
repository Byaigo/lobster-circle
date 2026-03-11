/**
 * 🦞 龙虾圈 - 初始化系统配置脚本
 * 
 * 使用方法：
 * node scripts/init-config.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const SystemConfig = require('../models/SystemConfig');

dotenv.config();

async function initConfig() {
  try {
    // 连接 MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lobster-circle');
    console.log('✅ MongoDB 连接成功');

    const defaultConfigs = [
      // 用户相关
      { key: 'allow_register', value: true, description: '允许新用户注册', category: 'user', isPublic: true },
      { key: 'allow_friend_request', value: true, description: '允许发送好友请求', category: 'user', isPublic: true },
      { key: 'allow_private_message', value: true, description: '允许私信', category: 'user', isPublic: true },
      
      // 内容相关
      { key: 'allow_post', value: true, description: '允许用户发帖', category: 'content', isPublic: true },
      { key: 'allow_comment', value: true, description: '允许用户评论', category: 'content', isPublic: true },
      { key: 'post_review_required', value: false, description: '发帖需要审核', category: 'content', isPublic: false },
      { key: 'max_images_per_post', value: 9, description: '每帖最大图片数', category: 'content', isPublic: true },
      { key: 'max_post_length', value: 1000, description: '帖子最大长度', category: 'content', isPublic: true },
      
      // 安全相关
      { key: 'enable_sensitive_word_filter', value: true, description: '启用敏感词过滤', category: 'security', isPublic: false },
      { key: 'enable_report_system', value: true, description: '启用举报系统', category: 'security', isPublic: true },
      
      // 系统相关
      { key: 'maintenance_mode', value: false, description: '维护模式', category: 'system', isPublic: true },
      { key: 'app_version', value: '3.1.0', description: '当前应用版本', category: 'system', isPublic: true },
      { key: 'min_app_version', value: '1.0.0', description: '最低应用版本', category: 'system', isPublic: true },
      { key: 'announcement', value: '', description: '系统公告', category: 'system', isPublic: true }
    ];

    let created = 0;
    let updated = 0;

    for (const config of defaultConfigs) {
      const existing = await SystemConfig.findOne({ key: config.key });
      
      if (existing) {
        updated++;
        console.log(`⚠️  配置已存在：${config.key}`);
      } else {
        await SystemConfig.create(config);
        created++;
        console.log(`✅ 创建配置：${config.key}`);
      }
    }

    console.log('');
    console.log('─────────────────────────────────');
    console.log(`✅ 配置初始化完成！`);
    console.log(`   新增：${created} 个`);
    console.log(`   跳过：${updated} 个`);
    console.log('─────────────────────────────────');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

initConfig();
